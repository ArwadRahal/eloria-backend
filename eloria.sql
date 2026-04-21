-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 21, 2026 at 10:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eloria`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Lip Liner', '2026-04-12 20:21:54'),
(2, 'Eyeliner', '2026-04-12 20:21:54'),
(3, 'Mascara', '2026-04-12 20:21:54'),
(4, 'Brow', '2026-04-12 20:21:54'),
(5, 'Lip Scrub', '2026-04-12 20:21:54'),
(6, 'Blush', '2026-04-12 20:21:54'),
(7, 'Lip Gloss', '2026-04-12 20:21:54'),
(8, 'Lip Oil', '2026-04-12 20:21:54'),
(9, 'Highlighter', '2026-04-12 20:21:54'),
(10, 'Accessories', '2026-04-12 20:21:54');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `city` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(50) NOT NULL DEFAULT 'cash_on_delivery',
  `status` enum('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
  `stock_restored` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_name`, `phone`, `city`, `address`, `notes`, `total_price`, `payment_method`, `status`, `stock_restored`, `created_at`, `updated_at`) VALUES
(8, 'Arwad Rahal', '0523334446', 'dfvdv', '555', '', 58.00, 'cash_on_delivery', 'pending', 0, '2026-04-18 19:45:06', '2026-04-18 19:45:06'),
(9, 'Arwad Rahal', '0523334446', 'dfvdv', '555', '', 34.00, 'cash_on_delivery', 'pending', 0, '2026-04-20 20:30:39', '2026-04-20 20:30:39'),
(10, 'Arwad Rahal', '0523334446', 'dfvdv', '555', '', 17.00, 'cash_on_delivery', 'pending', 0, '2026-04-20 20:41:46', '2026-04-20 20:41:46'),
(11, 'Arwad Rahal', '0523334446', 'dfvdv', '555', '', 50.00, 'cash_on_delivery', 'pending', 0, '2026-04-21 10:19:30', '2026-04-21 10:19:30'),
(12, 'Arwad Rahal', '0523334446', 'dfvdv', '555', '', 140.00, 'cash_on_delivery', 'pending', 0, '2026-04-21 11:08:48', '2026-04-21 11:08:48');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `price`, `created_at`) VALUES
(8, 8, 4, 'All-In-One Volume & Length Mascara', 1, 25.00, '2026-04-18 19:45:06'),
(9, 8, 6, 'Bubble Buff Lip Scrub', 1, 18.00, '2026-04-18 19:45:06'),
(10, 8, 11, 'Big N\' Bright Eye Pencil - White', 1, 15.00, '2026-04-18 19:45:06'),
(11, 9, 5, 'Brow Breakdown Brow Gel', 1, 17.00, '2026-04-20 20:30:39'),
(12, 9, 7, 'Get Foxy Eye Stamp & Liner Pen', 1, 17.00, '2026-04-20 20:30:39'),
(13, 10, 5, 'Brow Breakdown Brow Gel', 1, 17.00, '2026-04-20 20:41:46'),
(14, 11, 27, 'Dream Touch Blush - 016 Tickled Pink', 1, 25.00, '2026-04-21 10:19:30'),
(15, 11, 25, 'Dream Touch Blush - 019 Heart Eyes', 1, 25.00, '2026-04-21 10:19:30'),
(16, 12, 41, 'Stereo Face Six - French Girl', 4, 30.00, '2026-04-21 11:08:48'),
(17, 12, 38, 'Made For Me Eyelash Curler', 2, 10.00, '2026-04-21 11:08:48');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_url_2` text DEFAULT NULL,
  `image_url_3` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `description`, `price`, `image_url`, `stock`, `is_active`, `created_at`, `updated_at`, `image_url_2`, `image_url_3`) VALUES
(3, 'Bold Moves Kohl Cream Eyeliner Pencil', 2, '', 20.00, 'http://localhost:8801/uploads/1776715586789.png', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:06:26', NULL, NULL),
(4, 'All-In-One Volume & Length Mascara', 3, '', 25.00, 'http://localhost:8801/uploads/1776715640416.png', 3, 1, '2026-04-13 18:49:16', '2026-04-20 20:07:20', NULL, NULL),
(5, 'Brow Breakdown Brow Gel', 4, '', 17.00, 'http://localhost:8801/uploads/1776715648649.png', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:41:46', NULL, NULL),
(6, 'Bubble Buff Lip Scrub', 5, '', 18.00, '', 3, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(7, 'Get Foxy Eye Stamp & Liner Pen', 2, '', 17.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:30:39', NULL, NULL),
(8, 'Soft 90\'s Glam Lip Liner And Lip Duo Set - Haute Cocoa', 1, '', 30.00, '', 5, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(9, 'Lip Rules Liner & Gloss Pen - Judgey Much', 7, '', 15.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(10, 'Lip Rules Liner & Gloss Pen - Case X Case', 7, '', 15.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(11, 'Big N\' Bright Eye Pencil - White', 2, '', 15.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(12, 'Jelly Wow Hydrating Lip Oil - Loco for Coco', 8, '', 15.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(13, 'Jelly Wow Hydrating Lip Oil - Berry Involved', 8, '', 15.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(14, 'Glass Lock Air Gloss - That\'s My Jam', 7, '', 23.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(15, 'Glass Lock Air Gloss - Caramel Wave', 7, '', 23.00, '', 5, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(16, 'Pout-Perfect Shine Lip Plumper - Hot Stuff', 7, '', 22.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(17, 'Pout-Perfect Shine Lip Plumper - Peachy Keen', 7, '', 22.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(18, 'Bold Booster Lip Plumper - Berry Spritz', 7, '', 25.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(19, 'Bold Booster Lip Plumper - Latte Luxe', 7, '', 25.00, '', 5, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(20, 'Matte Allure Liquid Lipstick - Damsel', 7, '', 22.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(21, 'Matte Allure Liquid Lipstick - Sweet Poison', 7, '', 22.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(22, 'So Lippy Lip Liner Set - Rose Graden', 1, '', 26.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(23, 'Dream Touch Blush - 017 Wannabe', 6, '', 25.00, '', 3, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(24, 'Dream Touch Blush - 021 Don\'t Pink Twice', 6, '', 25.00, '', 2, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(25, 'Dream Touch Blush - 019 Heart Eyes', 6, '', 25.00, '', 2, 1, '2026-04-13 18:49:16', '2026-04-21 10:19:30', NULL, NULL),
(26, 'Dream Touch Blush - 209 Cherry Aura', 6, '', 25.00, '', 1, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(27, 'Dream Touch Blush - 016 Tickled Pink', 6, '', 25.00, 'http://localhost:8801/uploads/1776722655116.png', 1, 1, '2026-04-13 18:49:16', '2026-04-21 10:19:30', 'http://localhost:8801/uploads/1776722655124.png', 'http://localhost:8801/uploads/1776722655129.png'),
(28, 'Dream Touch Blush - 020 Knock Out', 6, '', 25.00, '', 2, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(29, 'Glowchi Bouncy Highlighter - Powdered Sugar', 9, '', 24.00, '', 5, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(30, 'Playing Cupid Cream Blush - Adorn', 6, '', 24.00, '', 3, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(31, 'Bubble Glow Blush Bar - Multicolor', 6, '', 22.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(32, 'Insta-Ready Face & Under Eye Setting Powder Duo - Bubblegum', 10, '', 30.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(33, 'Triple Threat Correcting Primer', 10, '', 25.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(34, 'Press Refresh Setting Spray', 10, '', 23.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(35, 'Glacier Glo Smoothing Primer', 10, '', 25.00, '', 1, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(36, 'Radiance Ring 3-In-1 Correcting Setting Powder', 10, '', 30.00, '', 3, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(37, 'Jelly-Licious Hydrating Lip & Blush Tint - Coucou', 6, '', 17.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(38, 'Made For Me Eyelash Curler', 10, '', 10.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-21 11:08:48', NULL, NULL),
(39, '3 Beautyblender', 10, '', 10.00, '', 6, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(40, 'Beach Sunset Palette', 10, '', 30.00, '', 4, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL),
(41, 'Stereo Face Six - French Girl', 10, '', 30.00, '', 0, 1, '2026-04-13 18:49:16', '2026-04-21 11:08:48', NULL, NULL),
(42, 'Wonka Bar Eyeshadow Palette', 10, '', 30.00, '', 3, 1, '2026-04-13 18:49:16', '2026-04-20 20:14:26', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
