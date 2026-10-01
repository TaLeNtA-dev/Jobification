CREATE TABLE jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100),
  company VARCHAR(100),
  logo VARCHAR(255),
  location VARCHAR(50),
  salary INT,
  type VARCHAR(50),
  category VARCHAR(50),
  experienceLevel VARCHAR(50),
  description TEXT,
  requirement VARCHAR(255),
  responsibility VARCHAR(255),
  postedAt DATE,
  deadline DATE
);
SELECT * FROM jobs
USE reactdb
show TABLE jobs
drop TABLE jobs 
INSERT INTO jobs (
  id, title, company, logo, location, salary, type, category,
  experienceLevel, description, postedAt, deadline
) VALUES (
  2,
  'UI/UX Designer',
  'PixelForge',
  '/Meta.jpg',
  'Remote',
  3000,
  'Contract',
  'Design',
  'Entry',
  'Join PixelForge as a UI/UX designer to create engaging user experiences for mobile and web.',
  '2025-07-15',
  '2025-08-10'
);
delete FROM jobs WHERE id = 2;