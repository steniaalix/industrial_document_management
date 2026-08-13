-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS `industrial_document_management`;
USE `industrial_document_management`;

-- 1. TABLE: departments
CREATE TABLE IF NOT EXISTS `departments` (
    `department_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT
) ENGINE=InnoDB;

-- 2. TABLE: categories
CREATE TABLE IF NOT EXISTS `categories` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT
) ENGINE=InnoDB;

-- 3. TABLE: users
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('EMPLOYEE', 'REVIEWER', 'ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
    `department_id` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_department`
        FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. TABLE: documents
CREATE TABLE IF NOT EXISTS `documents` (
    `doc_id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `category_id` INT NULL,
    `department_id` INT NULL,
    `owner_id` INT NOT NULL,
    `status` ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_documents_category`
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_documents_department`
        FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_documents_owner`
        FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. TABLE: document_versions
CREATE TABLE IF NOT EXISTS `document_versions` (
    `version_id` INT AUTO_INCREMENT PRIMARY KEY,
    `doc_id` INT NOT NULL,
    `version_number` INT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `uploaded_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `uq_doc_version` UNIQUE (`doc_id`, `version_number`),
    CONSTRAINT `fk_versions_document`
        FOREIGN KEY (`doc_id`) REFERENCES `documents` (`doc_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_versions_uploader`
        FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. TABLE: document_rejections
CREATE TABLE IF NOT EXISTS `document_rejections` (
    `rejection_id` INT AUTO_INCREMENT PRIMARY KEY,
    `version_id` INT NOT NULL,
    `rejected_by` INT NOT NULL,
    `reason` VARCHAR(1000) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rejections_version`
        FOREIGN KEY (`version_id`) REFERENCES `document_versions` (`version_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_rejections_user`
        FOREIGN KEY (`rejected_by`) REFERENCES `users` (`user_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. TABLE: tasks
CREATE TABLE IF NOT EXISTS `tasks` (
    `task_id` INT AUTO_INCREMENT PRIMARY KEY,
    `doc_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `assigned_to` INT NULL,
    `created_by` INT NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `due_date` DATE NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tasks_document`
        FOREIGN KEY (`doc_id`) REFERENCES `documents` (`doc_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_tasks_assigned`
        FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_tasks_creator`
        FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. TABLE: comments
CREATE TABLE IF NOT EXISTS `comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `doc_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comments_document`
        FOREIGN KEY (`doc_id`) REFERENCES `documents` (`doc_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_comments_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;
