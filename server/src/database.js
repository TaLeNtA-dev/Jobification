import 'dotenv/config';
import { createPool } from 'mysql2/promise';
import express from 'express';
import cors from 'cors';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from './utils.js';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { uploadFile, getImageUrl, deleteFile } from './cloudinaryService.js';
import upload from './uploadMiddleware.js';

if (!process.env.ACCESS_TOKEN || !process.env.REFRESH_TOKEN) {
  console.error('FATAL ERROR: JWT secrets are not defined in environment variables.');
  process.exit(1);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function getProfileIdFromIdentifier(userId, companyId) {
  if (userId) {
    const [[profile]] = await db.query(
      `SELECT id FROM profiles WHERE user_id = ?`,
      [userId]
    );
    return profile?.id;
  }
  if (companyId) {
    const [[profile]] = await db.query(
      `SELECT id FROM profiles WHERE company_id = ?`,
      [companyId]
    );
    return profile?.id;
  }
  return null;
}

const app = express();
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://jobification-indol.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    // allow whitelisted origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // allow any *.vercel.app preview URL for this project
    if (/^https:\/\/jobification.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(cookieParser());
const db = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {rejectUnauthorized: false},
  connectionLimit: 70,
  waitForConnections: true,
  queueLimit: 0
});

app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/jobs", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const offset = (page - 1) * limit;
  const category = req.query.category?.toLowerCase().trim();
  let filter =category==="salary"?(parseInt(req.query.filter, 10) ||100000):req.query.filter?.toLowerCase().trim();
  
  
  let dependency=[limit, offset]
  let query = `SELECT 
         j.id, j.title, j.location, j.salary, j.type, j.category,
         j.experienceLevel, j.description, j.requirements, j.responsibilities,
         j.postedAt, j.deadline, j.application_website,
         p.profile_name AS companyName, p.pfp AS companyPfpPublicId
       FROM jobs j JOIN profiles p ON p.company_id = j.company_id `
  if(filter){
    switch(category){
      case "salary":query +=`ORDER BY ABS(j.salary-?) ASC`;break;
      case "type":query +=`WHERE j.type LIKE ? ORDER BY LOCATE(? , type) ASC`;dependency=[filter,...dependency];filter=`%${filter}%`;break;
      case "location":query +=`WHERE j.location LIKE ? ORDER BY LOCATE(? , location) ASC`;dependency=[filter,...dependency];filter=`%${filter}%`;break;
      default :query +=`WHERE j.title LIKE ? ORDER BY LOCATE(? , title) ASC`;dependency=[filter,...dependency];filter=`%${filter}%`;break;
    }
    dependency=[filter,...dependency];
    }else query +=` ORDER BY j.postedAt DESC`
    
    query +=` LIMIT ? OFFSET ?`
  try {
    const [jobsSQL] = await db.query(query,dependency);

    const jobs = jobsSQL.map(job => ({
      ...job,
      pfp: getImageUrl(job.companyPfpPublicId),
    }));
    res.set('Cache-Control', 'public, max-age=60');
    res.json(jobs);

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json('Internal server error');
  }
});

app.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  if (!jobId || isNaN(Number(jobId))) {
    return res.status(400).json('Invalid job ID');
  }

  let currentUserId = null;
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const payload = await verifyRefreshToken(token);
      currentUserId = payload.sub;
    }
  } catch (err) {}

  try {
    const [rows] = await db.query(
      `SELECT 
         j.id, j.title, j.location, j.salary, j.type, j.category,
         j.experienceLevel, j.description, j.requirements, j.responsibilities,
         j.postedAt, j.deadline, j.application_website, j.company_id,
         p.pfp AS companyPfpPublicId,
         p.profile_name AS companyName,
         EXISTS (
           SELECT 1 FROM bookmarks 
           WHERE user_id = ? AND job_id = j.id
         ) AS bookmarked
       FROM jobs j
       JOIN profiles p ON p.company_id = j.company_id
       WHERE j.id = ?`,
      [currentUserId, jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json('Job not found');
    }

    const job = rows[0];
    job.pfp = getImageUrl(job.companyPfpPublicId);

    delete job.companyPfpPublicId;

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(job);

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json('Internal server error');
  }
});

app.post("/offer", async (req, res) => {
  try {
    const {
      title, company, location, salary, type, category,
      experienceLevel, description, requirements, responsibilities,
      deadline, id, website
    } = req.body;

    const sql = `
      INSERT INTO jobs (
        title, location, salary, type, category,
        experienceLevel, description, requirements, responsibilities,
        deadline, company_id, application_website
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      title, location, salary, type, category,
      experienceLevel, description, requirements, responsibilities,
      deadline, id, website
    ];

    const [result] = await db.query(sql, values);
    res.status(201).json({ message: "Job created successfully", id: result.insertId });
  } catch (err) {
    console.error('Error in /offer:', err);
    res.status(500).json(err.message);
  }
});

app.post("/login", authLimiter, async (req, res) => {
  const { password, email } = req.body;
  if (!email || !password) return res.status(400).json('Email or password are required');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json('Invalid email format');

  try {
    const [rows] = await db.query(
      'SELECT id, userName, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return res.status(401).json('Invalid email');
    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json('Invalid password');

    const accessToken = await createAccessToken({ id: user.id, userName: user.userName });
    const refreshToken = await createRefreshToken({ id: user.id });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.userName,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json('Internal server error');
  }
});

app.post("/signUp", authLimiter, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  const { userName, password, email, phoneNumber, name, website, bio } = req.body;

  if (!userName) return res.status(400).json('UserName is missing');
  if (!name) return res.status(400).json('Name is missing');
  if (!password) return res.status(400).json('Password is missing');
  if (!email) return res.status(400).json('Email is missing');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json('Invalid email format');

  const logoFile = req.files?.logo?.[0];
  const bannerFile = req.files?.banner?.[0];

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        'INSERT INTO users (userName, password_hash, email, phone_number) VALUES (?, ?, ?, ?)',
        [userName, hashedPassword, email, phoneNumber || null]
      );
      const userId = userResult.insertId;

      var logoPublicId = null, logoUrl = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, `users/${userId}/logo`);
        logoPublicId = result.public_id;
        logoUrl = result.url;
      }

      var bannerPublicId = null, bannerUrl = null;
      if (bannerFile) {
        const result = await uploadFile(bannerFile, `users/${userId}/banner`);
        bannerPublicId = result.public_id;
        bannerUrl = result.url;
      }

      const [profileResult] = await connection.query(
        `INSERT INTO profiles (user_id, type, profile_name, pfp, banner, bio, website)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'user', name, logoPublicId, bannerPublicId, bio || null, website || null]
      );
      const profileId = profileResult.insertId;

      await connection.commit();

      const accessToken = await createAccessToken({ id: userId, userName });
      const refreshToken = await createRefreshToken({ id: userId });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        accessToken,
        user: {
          id: userId,
          userName: userName,
          email,
          phoneNumber: phoneNumber || null,
          profile: {
            id: profileId,
            name,
            pfp: logoPublicId ? getImageUrl(logoPublicId, { width: 200, height: 200, crop: 'fill' }) : null,
            banner: bannerPublicId ? getImageUrl(bannerPublicId, { width: 1500, height: 500, crop: 'fill' }) : null,
            bio,
            website,
          }
        }
      });

    } catch (err) {
      deleteFile(logoPublicId);
      deleteFile(bannerPublicId);
      await connection.rollback();
      console.error('Transaction error:', err);

      if (err.code === 'ER_DUP_ENTRY') {
        if (err.sqlMessage.includes('userName')) return res.status(409).json('UserName already taken');
        if (err.sqlMessage.includes('email')) return res.status(409).json('Email already in use');
      }
      return res.status(500).json('Registration failed');
    } finally {
      connection.release();
    }
  } catch (hashError) {
    console.error('Password hashing error:', hashError);
    return res.status(500).json('Internal server error');
  }
});

app.get("/api/refresh", async (req, res) => {
  try {
    const payload = await verifyRefreshToken(req.cookies.refreshToken);
    const [rows] = await db.query('SELECT userName FROM users WHERE id = ?', [payload.sub]);

    if (rows.length === 0) {
      return res.status(401).json("Account no longer exists");
    }

    const token = await createAccessToken({ id: payload.sub, userName: rows[0].userName });
    res.json({ accessToken: token });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(401).json("Refresh token invalid or expired");
  }
});

app.post("/profile/post", upload.fields([{ name: "media", maxCount: 5 }]), async (req, res) => {
  const caption = req.body?.caption || null;
  const compId = req.body?.compId || null;
  const media = req.files?.media?.[0];
  if (!caption && !media) {
    return res.status(400).json({ message: "No post elements were sent" });
  }

  let connection;
  try {
    let profileQuery;
    let payload;
    if(!compId){
      payload = (await verifyRefreshToken(req.cookies.refreshToken)).sub;
      profileQuery="SELECT id FROM profiles WHERE user_id = ?"
    }else  profileQuery="SELECT id FROM profiles WHERE company_id = ?"
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[profileRow]] = await connection.query(profileQuery,[compId?compId:payload]);
    const profileId = profileRow?.id;

    if (!profileId) {
      await connection.rollback();
      return res.status(404).json({ message: "Profile not found" });
    }

    var mediaPublicId = null;
    var mediaUrl = null;
    if (media) {
      const result = await uploadFile(media, `profiles/${profileId}/posts`);
      mediaPublicId = result.public_id;
      mediaUrl = result.url;
    }

    const [insertResult] = await connection.query(
      "INSERT INTO posts (profile_id, caption, media) VALUES (?, ?, ?)",
      [profileId, caption, mediaPublicId]
    );

    await connection.commit();
    return res.status(201).json({
      postId: insertResult.insertId,
      url: mediaUrl,
      message: "Post succeeded"
    });

  } catch (err) {
    deleteFile(mediaPublicId)
    console.error('Post error:', err);
    if (connection) {
      await connection.rollback().catch(console.error);
    }
    return res.status(500).json(err.message);
  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch (releaseErr) {
        console.error('Release error:', releaseErr);
      }
    }
  }
});

app.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    const [comments] = await db.query(
      `SELECT c.id, c.comment, c.created_at,p.profile_name,u.userName,u.id as user_id,p.pfp
       FROM comments c JOIN profiles p ON c.profile_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE c.post_id = ? AND c.parent_comment_id IS NULL
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [postId, limit, offset]
    );
    comments.forEach(c => c.pfp = getImageUrl(c.pfp));
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json('Internal server error');
  }
});

app.get("/posts", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const companyId = parseInt(req.query.compid, 10) || null;
  const userId = parseInt(req.query.userid, 10) || null;
  const offset = (page - 1) * limit;
  try {
    let sql = `SELECT posts.*, p.user_id, p.company_id, p.profile_name, p.pfp, u.userName,cd.name as companyURL  
      FROM posts JOIN profiles p ON posts.profile_id = p.id LEFT JOIN users u ON p.user_id = u.id LEFT JOIN company_details cd ON p.company_id = cd.id`;

    const params = [];

    if (companyId) {
      sql += ` WHERE p.company_id = ?`;
      params.push(companyId);
    }else if(userId){
      sql += ` WHERE p.user_id = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY posts.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [posts] = await db.query(sql, params);

    posts.forEach((post) => {
      post.media = getImageUrl(post.media);
      post.pfp = getImageUrl(post.pfp);
    });
    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "couldn't reach the database" });
  }
});

app.get("/info/:userName",async (req, res)=> {
  const userName = req.params.userName;
  try{
    const [infos] = await db.query(`SELECT 
  users.userName,profiles.user_id,profiles.profile_name,profiles.pfp
  FROM users JOIN profiles ON users.id = profiles.user_id WHERE users.userName = ?`,[userName]);
  infos.forEach((info)=> info.pfp = getImageUrl(info.pfp));
  return res.json(infos);
} catch (err) {
  return res.status(500).json({ message: "couldn't reach the database" });
}
})

app.get("/pfp",async (req, res)=> {
  let id= req.query.id
  try{
  if(!id) {
    id = (await verifyRefreshToken(req.cookies.refreshToken)).sub
    if (!id) return res.status(401).json({ message: "Unauthorized" });
  }
  const [rows] = await db.query(`SELECT pfp FROM profiles WHERE user_id = ?`,[id]);
  if (!rows.length) return res.status(404).json({ message: "User not found" });

  const pfp = getImageUrl(rows[0].pfp);
  return res.json(pfp);
  }catch(err) {
    console.error(err);
    return res.status(500).json({ message: "couldn't reach the database or token" });
}})

app.get("/:userName",async (req, res)=> {
  const userName = req.params.userName;
  try{
    const [[profile]] = await db.query(`SELECT 
  users.userName,users.created_at,p.user_id,p.profile_name,p.pfp,p.banner,p.bio,p.website
  FROM users JOIN profiles p ON users.id = p.user_id WHERE users.userName = ?`,[userName]);
  profile.banner = getImageUrl(profile.banner);
  profile.pfp = getImageUrl(profile.pfp);
  return res.json(profile);
  }catch (err) {
  return res.status(500).json({ message: "couldn't reach the database" });
}})

app.get("/posts/likes",async (req, res)=> {
  const postId = req.query?.id
  try{
  const userId = (await verifyRefreshToken(req.cookies.refreshToken)).sub
  const[[likes]] = await db.query(`SELECT 
    COUNT(*) AS likeCount,
    EXISTS (
        SELECT 1 
        FROM likes l2
        INNER JOIN profiles p ON l2.profile_id = p.id
        WHERE l2.post_id = ? AND p.user_id = ?
    ) AS isLiked FROM likes WHERE post_id = ?;`,[postId,userId,postId])
     return res.json(likes);
  }catch (err){
    return res.status(500).json({ message: "couldn't reach the database or varify token" });
  }
})

app.post("/posts/likes", async (req, res) => {
  const postId = req.query?.id;
  if (!postId) {
    return res.status(400).json({ message: "Post ID is required" });
  }

  try {
    const userId = (await verifyRefreshToken(req.cookies.refreshToken)).sub;

    await db.query(
      `INSERT INTO likes (profile_id, post_id)
       SELECT p.id, ? FROM profiles p WHERE p.user_id = ?`,
      [postId, userId]
    );

    return res.status(201).json({ message: "Post liked successfully" });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Already liked" });
    }
    console.error("Like error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/posts/likes", async (req, res) => {
  const postId = req.query?.id;
  if (!postId) {
    return res.status(400).json({ message: "Post ID is required" });
  }

  try {
    const userId = (await verifyRefreshToken(req.cookies.refreshToken)).sub;

    await db.query(
      `DELETE FROM likes
       WHERE post_id = ?
       AND profile_id = (SELECT id FROM profiles WHERE user_id = ?)`,
      [postId, userId]
    );

    return res.json({ message: "Post unliked" });
  } catch (err) {
    console.error("Unlike error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/posts/:userName", async (req, res) => {
  const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100); 
  const offset = (page - 1) * limit;
  const userName = req.params.userName;
  try {
    const sql = `SELECT posts.*, p.user_id, p.profile_name, p.pfp FROM posts JOIN profiles p ON posts.profile_id = p.id
      JOIN users u ON p.user_id = u.id WHERE u.userName = ? ORDER BY posts.created_at DESC, posts.id DESC LIMIT ? OFFSET ?`;
    const params = [userName, limit, offset];
    const [posts] = await db.query(sql, params);
    posts.forEach((p)=>p.pfp=getImageUrl(p.pfp))
    posts.forEach((p)=>p.media=getImageUrl(p.media))
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post("/c/create", authLimiter, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  const { pageName, URL, email, industry, companySize, companyType, tagline, website, location, foundingYear } = req.body;

  if (!pageName) return res.status(400).json('Page Name is required');
  if (!URL) return res.status(400).json('Page URL is required');
  if (!email) return res.status(400).json('Email is required');
  if (!industry) return res.status(400).json('Industry is required');
  if (!companySize) return res.status(400).json('Company Size is required');
  if (!companyType) return res.status(400).json('Company Type is required');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json('Invalid email format');

  const logoFile = req.files?.logo?.[0];
  const bannerFile = req.files?.banner?.[0];

  try {
    const userId = (await verifyRefreshToken(req.cookies.refreshToken)).sub;
    const connection = await db.getConnection();

    const [[existingOwner]] = await connection.query(
      `SELECT company_id FROM company_admins WHERE admin_id = ? AND role = 'owner'`,
      [userId]
    );

    if (existingOwner) {
      connection.release(); 
      return res.status(409).json('You already own a company');
    }

    try {
      await connection.beginTransaction();

      var logoPublicId = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, `companies/${userId}/logo`);
        logoPublicId = result.public_id;
      }

      var bannerPublicId = null;
      if (bannerFile) {
        const result = await uploadFile(bannerFile, `companies/${userId}/banner`);
        bannerPublicId = result.public_id;
      }

      const [companyResult] = await connection.query(
        `INSERT INTO company_details 
         (name, industry, founding_year, location, email, company_size, company_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [URL, industry, foundingYear || null, location || null, email, companySize, companyType]
      );

      const compId = companyResult.insertId;

      await connection.query(
        `INSERT INTO profiles (profile_name,company_id, type, pfp, banner, bio, website)
         VALUES (?,?, 'company', ?, ?, ?, ?)`,
        [pageName,compId, logoPublicId, bannerPublicId, tagline || null, website || null]
      );

      await connection.query(
        `INSERT INTO company_admins (admin_id, company_id, role)
         VALUES (?, ?, 'owner')`,
        [userId, compId]
      );

      await connection.commit();

      res.status(201).json({ message: 'Company created successfully', companyURL});

    } catch (err) {
      deleteFile(logoPublicId);
      deleteFile(bannerPublicId);
      await connection.rollback();
      console.error('Transaction error:', err);

      if (err.code === 'ER_DUP_ENTRY') {
        if (err.sqlMessage.includes('email')) return res.status(409).json('Email already in use');
        if (err.sqlMessage.includes('name')) return res.status(409).json('Company URL already taken');
      }
      return res.status(500).json('Company creation failed');

    } finally {
      connection.release();
    }

  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json('Unauthorized');
  }
});

app.get("/c/user/myCompany", async (req, res) => {
  let currentUserId = null;
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json('Unauthorized');
    const payload = await verifyRefreshToken(token);
    currentUserId = payload.sub;
  } catch (err) {
    return res.status(401).json('Invalid token');
  }

  try {
    const [[company]] = await db.query(
      `SELECT 
         cd.id, cd.name as companyURL
       FROM company_admins ca JOIN company_details cd ON ca.company_id = cd.id
       WHERE ca.admin_id = ? AND ca.role = 'owner' LIMIT 1`,
      [currentUserId]
    );

    if (!company) {
      return res.status(404).json({ error: 'You are not an owner of any company' });
    }

    company.pfp = getImageUrl(company.pfp);
    company.banner = getImageUrl(company.banner);

    res.json(company);
  } catch (error) {
    console.error('Error fetching my company:', error);
    res.status(500).json('Internal server error');
  }
});

app.get("/c/:companyURL", publicLimiter, async (req, res) => {
  const { companyURL } = req.params;
  if (!companyURL) return res.status(400).json('Missing company URL');

  let currentUserId = null;
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json('Unauthorized');
    const payload = await verifyRefreshToken(token);
    currentUserId = payload.sub;
  } catch (err) {
    return res.status(401).json('Invalid token');
  }

  try {
    const [[company]] = await db.query(
      `SELECT  cd.id, cd.name AS companyURL ,cd.industry, cd.founding_year, cd.location, cd.email, cd.company_size,
       cd.company_type, p.pfp,p.banner, p.bio, p.website,
    CASE WHEN COUNT(ca.admin_id) = 0 THEN JSON_ARRAY() ELSE JSON_ARRAYAGG(JSON_OBJECT('id', ca.admin_id, 'role', ca.role))
    END AS admins FROM company_details cd JOIN profiles p ON cd.id = p.company_id LEFT JOIN company_admins ca ON cd.id = ca.company_id
   WHERE cd.name = ? GROUP BY cd.id, cd.name, cd.industry, cd.founding_year, cd.location, cd.email,
    cd.company_size, cd.company_type, p.pfp, p.banner, p.bio, p.website LIMIT 1;`,[companyURL]);

    if (!company) return res.status(404).json('Company not found');

    company.banner = getImageUrl(company.banner);
    company.pfp = getImageUrl(company.pfp);

    res.set('Cache-Control', 'public, max-age=300');
    res.json(company);
  } catch (error) {
    console.error('Company fetch error:', error);
    res.status(500).json('Internal server error');
  }
});

app.get("/c/jobs/:id", async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json('Invalid company ID');
  }

  let currentUserId = null;
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const payload = await verifyRefreshToken(token);
      currentUserId = payload.sub;
    }
  } catch (err) { }

  try {
    const [jobs] = await db.query(
      `SELECT 
         j.id, j.title, j.location, j.salary, j.type, j.category,
         j.experienceLevel, j.description, j.requirements, j.responsibilities,
         j.postedAt, j.deadline, j.application_website, j.company_id,
         cd.name AS companyName,
         p.pfp AS companyPfpPublicId,
         EXISTS (
           SELECT 1 FROM bookmarks 
           WHERE user_id = ? AND job_id = j.id
         ) AS bookmarked
       FROM jobs j
       JOIN company_details cd ON j.company_id = cd.id
       JOIN profiles p ON cd.id = p.company_id
       WHERE j.company_id = ?
       ORDER BY j.postedAt DESC
       LIMIT ? OFFSET ?`,
      [currentUserId, id, limit, offset]
    );

    const jobsWithLogo = jobs.map(job => ({
      ...job,
      pfp: getImageUrl(job.companyPfpPublicId),
    }));

    res.json(jobsWithLogo);

  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json('Internal server error');
  }
});

app.get("/c/myCompanies", async (req, res) => {
  let currentUserId = null;
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json('Unauthorized');
    const payload = await verifyRefreshToken(token);
    currentUserId = payload.sub;
  } catch (err) {
    return res.status(401).json('Invalid token');
  }

  try {
    const [companies] = await db.query(
      `SELECT 
         cd.name,
         p.bio,
         p.pfp,
         ca.role
       FROM company_admins ca
       JOIN company_details cd ON ca.company_id = cd.id
       JOIN profiles p ON cd.id = p.company_id
       WHERE ca.admin_id = ?
       ORDER BY ca.role DESC, cd.name ASC`,
      [currentUserId]
    );
    const companiesWithPfp = companies.map(c => ({
      ...c,
      pfp: getImageUrl(c.pfp),
    }));

    res.json(companiesWithPfp);
  } catch (error) {
    console.error('Error fetching admin companies:', error);
    res.status(500).json('Internal server error');
  }
});

app.get("/profile/followers", async (req, res) => {
  const { userId, companyId } = req.query;
  const targetProfileId = await getProfileIdFromIdentifier(userId, companyId);

  if (!targetProfileId) {
    return res.status(404).json("Profile not found");
  }

  const [[{ count }]] = await db.query(`SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?`,[targetProfileId]);

  let isFollowing = false;
  try {
    const token = req.cookies.refreshToken; 
    if (token) {
      const payload = await verifyRefreshToken(token);
      const loggedInUserId = payload.sub; 
      const [[loggedInProfile]] = await db.query(`SELECT id FROM profiles WHERE user_id = ?`,[loggedInUserId]);
      if (loggedInProfile) {
        const [[follow]] = await db.query(`SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?`,[loggedInProfile.id, targetProfileId]);
        isFollowing = !!follow;
      }
    }
  } catch (err) {res.status(500).json({ message: 'Internal server error',err });}

  res.json({
    followersCount: count,
    isFollowing
  });
});

app.post("/profile/follow", async (req, res) => {
  const { userId, companyId } = req.body;

  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json("Unauthorized");

  let loggedInProfileId;
  try {
    const payload = await verifyRefreshToken(token);
    const loggedInUserId = payload.sub;
    const [[profile]] = await db.query(`SELECT id FROM profiles WHERE user_id = ?`,[loggedInUserId]);
    if (!profile) return res.status(404).json("Your profile not found");
    loggedInProfileId = profile.id;
  } catch (err) {
    return res.status(401).json("Invalid token");
  }

  const targetProfileId = await getProfileIdFromIdentifier(userId, companyId);
  if (!targetProfileId) {return res.status(404).json("Target profile not found");}

  if (loggedInProfileId === targetProfileId) {return res.status(400).json("You can't follow yourself");}

  try {
    await db.query(`INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)`,[loggedInProfileId, targetProfileId]);
    res.json({ message: "Followed successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json("Already following");
    }
    console.error(err);
    res.status(500).json("Database error");
  }
});

app.delete("/profile/unfollow", async (req, res) => {
  const { userId, companyId } = req.query;

  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json("Unauthorized");

  let loggedInProfileId;
  try {
    const payload = await verifyRefreshToken(token);
    const loggedInUserId = payload.sub;
    const [[profile]] = await db.query(`SELECT id FROM profiles WHERE user_id = ?`,[loggedInUserId]);
    if (!profile) return res.status(404).json("Your profile not found");
    loggedInProfileId = profile.id;
  } catch (err) {return res.status(401).json("Invalid token");}

  const targetProfileId = await getProfileIdFromIdentifier(userId, companyId);
  if (!targetProfileId) {return res.status(404).json("Target profile not found");}

  const { affectedRows } = await db.query(`DELETE FROM follows WHERE follower_id = ? AND followed_id = ?`,[loggedInProfileId, targetProfileId]);

  if (affectedRows === 0) {return res.status(404).json("Not following this profile");}
  res.json({ message: "Unfollowed successfully" });
});

app.post("/bookmark", async (req, res) => {
  const { jobId } = req.body;
  try {
    const userId = (await verifyRefreshToken(req.cookies.refreshToken)).sub;
    await db.query(`INSERT INTO bookmarks (user_id, job_id) VALUES (?, ?)`, [userId, jobId]);
    res.json({ message: "Job bookmarked successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json("Already bookmarked");
    }
    res.status(500).json("Database error");
  }
});

app.delete("/bookmark", async (req, res) => {
  const { jobId } = req.query;
  try{
    const userId = (await verifyRefreshToken(req.cookies.refreshToken)).sub;
    const { affectedRows } = await db.query(
      `DELETE FROM bookmarks WHERE user_id = ? AND job_id = ?`,
      [userId, jobId]
    );

    if (affectedRows === 0) {
      return res.status(404).json("Bookmark not found");
    }
    res.json({ message: "Bookmark removed" });
  }catch(err){res.status(500).json(err);}
  
});

app.get("/:userName/bookmarked", async (req, res) => {
  const { userName } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const offset = (page - 1) * limit;
  let currentUserId = null;
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const payload = await verifyRefreshToken(token);
      currentUserId = payload.sub;
    }
  } catch (err) {}

  try {
    const [[user]] = await db.query(
      `SELECT id FROM users WHERE userName = ?`,
      [userName]
    );
    if (!user) return res.status(404).json("User not found" );

    const userId = user.id;

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?`,
      [userId]
    );
    const totalPages = Math.ceil(total / limit) || 1;

    const [jobs] = await db.query(
      `SELECT 
         j.id, j.title, j.location, j.salary, j.type, j.category,
         j.experienceLevel, j.description, j.requirements, j.responsibilities,
         j.postedAt, j.deadline,
         p.profile_name AS companyName,
         p.pfp AS companyPfpPublicId,
         EXISTS (
           SELECT 1 FROM bookmarks 
           WHERE user_id = ? AND job_id = j.id
         ) AS bookmarked
       FROM bookmarks b
       JOIN jobs j ON b.job_id = j.id
       JOIN company_details cd ON j.company_id = cd.id
       JOIN profiles p ON cd.id = p.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [currentUserId, userId, limit, offset]
    );

    const jobsWithLogo = jobs.map(job => ({
      ...job,
      pfp: getImageUrl(job.companyPfpPublicId),
    }));

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ jobs: jobsWithLogo, totalPages });

  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json('Internal server error' );
  }
});

app.get("/comments/:commentId/replies", async (req, res) => {
  const { commentId } = req.params;

  try {
    const [replies] = await db.query(
      `SELECT 
         c.id, c.comment, c.created_at,
         p.profile_name, p.pfp
       FROM comments c
       JOIN profiles p ON c.profile_id = p.id
       WHERE c.parent_comment_id = ?
       ORDER BY c.created_at ASC`,
      [commentId]
    );

    replies.forEach(r => r.pfp = getImageUrl(r.pfp));
    res.json(replies);

  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json('Internal server error');
  }
});

app.post("/comments", async (req, res) => {
  const { postId, parentCommentId, comment } = req.body;
  let profileId;
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("Unauthorized");
    const payload = await verifyRefreshToken(token);
    const userId = payload.sub;
    const [[profile]] = await db.query(
      `SELECT id FROM profiles WHERE user_id = ?`,
      [userId]
    );
    if (!profile) return res.status(404).json("Profile not found");
    profileId = profile.id;
  } catch (err) {
    return res.status(401).json("Invalid token");
  }

  if (!postId || !comment) {
    return res.status(400).json("Post ID and comment are required");
  }

  try {
    const [result] = await db.query(
      `INSERT INTO comments (profile_id, post_id, parent_comment_id, comment)
       VALUES (?, ?, ?, ?)`,
      [profileId, postId, parentCommentId || null, comment]
    );

    res.status(201).json({
      message: "Comment added",
      commentId: result.insertId,
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json('Internal server error');
  }
});

app.delete("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  let profileId;
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("Unauthorized");
    const payload = await verifyRefreshToken(token);
    const userId = payload.sub;
    const [[profile]] = await db.query(`SELECT id FROM profiles WHERE user_id = ?`,[userId]);
  
    if (!profile) return res.status(404).json("Profile not found");
    profileId = profile.id;
  } catch (err) {return res.status(401).json("Invalid token");}

  try {
    const { affectedRows } = await db.query(`DELETE FROM comments WHERE id = ? AND profile_id = ?`,[commentId, profileId]);

    if (affectedRows === 0) {return res.status(404).json("Comment not found or not yours");}
    res.json({ message: "Comment deleted" });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json('Internal server error');
  }
});

app.put("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body; 

  if (!commentId || isNaN(Number(commentId))) {
    return res.status(400).json("Invalid comment ID");
  }
  if (!comment || comment.trim() === "") {
    return res.status(400).json("Comment content cannot be empty");
  }

  let profileId;
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("Unauthorized");

    const payload = await verifyRefreshToken(token);
    const userId = payload.sub;

    const [[profile]] = await db.query(`SELECT id FROM profiles WHERE user_id = ?`,[userId]);
    if (!profile) return res.status(404).json("Profile not found");
    profileId = profile.id;
  } catch (err) {
    return res.status(401).json("Invalid token");
  }

  try {
    const [rows] = await db.query(`SELECT id, profile_id FROM comments WHERE id = ?`,[commentId]);
    if (rows.length === 0) {
      return res.status(404).json("Comment not found");
    }
    if (rows[0].profile_id !== profileId) {
      return res.status(403).json("You can only edit your own comments");
    }

    await db.query(`UPDATE comments SET comment = ? WHERE id = ?`,[comment.trim(), commentId]);

    const [[updated]] = await db.query(`SELECT c.id, c.comment, c.created_at, p.profile_name, p.pfp,u.userName,u.id as user_id
      FROM comments c JOIN profiles p ON c.profile_id = p.id LEFT JOIN users u ON p.user_id=u.id
      WHERE c.id = ?`,[commentId]);
    updated.pfp=getImageUrl(updated.pfp)
    res.json({message: "Comment updated successfully",comment: updated,});

  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json("Internal server error");
  }
});

app.post("/experience/post", async (req,res)=>{
  const {userName,companyName,startedAt,endedAt=null,desc,title}=req.body
  try{
    const [result] = await db.query(`INSERT INTO experience (user_id,company_name,title,description,started_at,ended_at) VALUES ((Select id from users where userName=?),?,?,?,?,?)`,
      [userName,companyName,title,desc,startedAt,endedAt]);

      res.json({message:"seccess",result})
  }catch (error) {
    console.error('Error adding experience:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW' || error.errno === 1452) {
      return res.status(404).json({field: 'companyName',message: 'Company does not exist. Please select a valid company from the list.'});
    }
    res.status(500).json('Internal server error');
  }})

  app.get("/experience/get", async (req,res)=>{
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 3;
    const userName = req.query.userName;
    if (!userName) res.status(400).json('no userName');
    const offset = (page - 1) * limit;
    try{
    const [rows] = await db.query(`SELECT e.*,p.pfp FROM experience e JOIN users u ON e.user_id = u.id
      LEFT JOIN profiles p ON (SELECT id FROM company_details cd WHERE cd.name=e.company_name) = p.company_id
       WHERE u.userName = ? ORDER BY e.created_at DESC LIMIT ? OFFSET ?`
      ,[userName,limit,offset]);
      rows.forEach(r=>r.pfp= getImageUrl(r.pfp))
      res.json(rows.length>=1?rows:null)
  }catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json('Internal server error');
  }})

  app.post("/education/post", authLimiter, upload.fields([{ name: 'logo', maxCount: 1 },]), async (req,res)=>{
  const {school,degree,field,startedAt,endedAt=null}=req.body
  const logoFile = req.files?.logo[0]
  let userId
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("Unauthorized");
    userId = (await verifyRefreshToken(token)).sub;
  } catch (err) {
    return res.status(401).json({message:"Invalid token",err});
  }
  try{
    var logoPublicId
    if(logoFile) {
      const result= uploadFile(logoFile,"school/logo")
      logoPublicId = (await result).public_id
    }
    const [result] = await db.query(`INSERT INTO education (user_id,school,degree,\`field\`,logo,started_at,ended_at) VALUES (?,?,?,?,?,?,?)`,
      [userId,school,degree,field,logoPublicId,startedAt,endedAt]);

      res.json({message:"seccess",result})
  }catch (error) {
    deleteFile(logoPublicId);
    console.error('Error adding education:', error);
    res.status(500).json('Internal server error');
  }})

  app.get("/education/get", async (req,res)=>{
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 3;
    const userName = req.query.userName;
    if (!userName) res.status(400).json('no userName');
    const offset = (page - 1) * limit;
    try{
    const [rows] = await db.query(`SELECT e.* FROM education e JOIN users u ON e.user_id = u.id
       WHERE u.userName = ? ORDER BY e.created_at DESC LIMIT ? OFFSET ?`
      ,[userName,limit,offset]);
      rows.forEach(r=>r.logo= getImageUrl(r.logo))
      res.json(rows.length>=1?rows:null)
  }catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json('Internal server error');
  }})

  app.post("/skill/post",async (req,res)=>{
    const {title,compName} = req.body
    let userId
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json("Unauthorized");
      userId = (await verifyRefreshToken(token)).sub;
    } catch (err) {
      console.log(err)
      return res.status(401).json({message:"Invalid token",err});
    }
    try{
      const [result] = await db.query(`INSERT INTO skill (user_id,title,company_id)
         VALUES(?,?,(select id from company_details cd WHERE cd.name=? ))`,[userId,title,compName])
      res.json({message:"seccess",result})
    }catch (error) {
    console.error('Error adding Skill:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW' || error.errno === 1452) {
      return res.status(404).json({field: 'companyName',message: 'Company does not exist. Please select a valid company from the list.'});
    }
    res.status(500).json('Internal server error');
  }})

  app.get("/skill/get",async (req,res)=>{
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 3;
    const userName = req.query.userName;
    if (!userName) res.status(400).json('no userName');
    const offset = (page - 1) * limit;
    try{
      const [rows] = await db.query(
        `SELECT s.*, c.pfp AS compPFP, cp.name AS compName FROM skill s LEFT JOIN company_details cp ON s.company_id = cp.id LEFT JOIN profiles c ON cp.id = c.company_id
        JOIN users u ON u.id = s.user_id WHERE u.userName = ? ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,[userName, limit, offset]
      );
      rows.forEach((e)=> e.compPFP= getImageUrl(e.compPFP))
      res.json(rows.length>=1?rows:null)
    }catch (error) {
      console.error('Error fetching skill:', error);
      res.status(500).json('Internal server error');
    }
  })
  
app.listen(3000);

// Keep Aiven alive — ping every 5 minutes
setInterval(async () => {
  try {
    await db.query('SELECT 1');
    console.log('DB keep-alive ping OK');
  } catch (err) {
    console.error('DB keep-alive failed:', err.message);
  }
}, 5 * 60 * 1000); 