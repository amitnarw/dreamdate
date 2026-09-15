<?php
/**
 * image.php - Standalone private image endpoint
 *
 * Lives OUTSIDE WordPress so each request doesn't pay the ~400-1500ms WP
 * boot cost. ~50-100ms per image vs 1-5s when served from the WP plugin.
 *
 * Deploy: paste this file at Hostinger public_html/image.php (next to
 * wp-content/, etc.). Same private_videos/ directory as the WP plugin.
 *
 * URL contract (unchanged from the WP route):
 *   /image.php?key=APP_KEY&file=img_1_1.jpg
 *   X-App-Key: APP_KEY  (header variant)
 *
 * Headers:
 *   - Cache-Control: private, max-age=31536000, immutable (1 year; images are content-addressed by filename)
 *   - ETag based on (mtime, size)
 *   - 304 Not Modified on conditional GET
 *   - Content-Disposition: inline (so phones save as image, not download)
 */

if (!defined('ABSPATH')) { // not used here, just a sanity marker
}

// --- Config (must match the WP plugin) ---
define('PRIVATE_VIDEO_APP_KEY', 'v9Kp2xR7mQ4zL8aN6tY3sW1');
const PRIVATE_VIDEO_DIR       = '/home/u924093506/private_videos/';
const PRIVATE_IMAGE_SUBDIR    = 'images/';
const PRIVATE_IMAGE_EXT       = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// --- Auth (header OR ?key=) ---
$provided_key = $_SERVER['HTTP_X_APP_KEY'] ?? ($_GET['key'] ?? '');
if ($provided_key === '' || !hash_equals(PRIVATE_VIDEO_APP_KEY, $provided_key)) {
    http_response_code(401);
    header('Content-Type: text/plain');
    exit('Unauthorized');
}

// --- File resolution ---
// Both URL shapes work: /image.php?file=img_1_1.jpg  AND  /image.php/img_1_1.jpg
$file = isset($_GET['file']) ? (string) $_GET['file'] : '';
if ($file === '') {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
    $marker = '/image.php/';
    $pos = strpos($uri, $marker);
    if ($pos !== false) {
        $file = substr($uri, $pos + strlen($marker));
    }
}
$file = str_replace('\\', '/', $file);
$file = ltrim($file, '/');
$base = basename($file); // strip any path the caller sent
if ($base === '' || strpos($file, '/') !== false || strpos($file, "\0") !== false) {
    http_response_code(400);
    exit('Bad file');
}
$ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));
if (!in_array($ext, PRIVATE_IMAGE_EXT, true)) {
    http_response_code(403);
    exit('File type not allowed');
}

$path = PRIVATE_VIDEO_DIR . PRIVATE_IMAGE_SUBDIR . $base;
if (!is_file($path)) {
    http_response_code(404);
    exit('Not found');
}

// --- Type map ---
$mime_types = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'webp' => 'image/webp',
    'gif'  => 'image/gif',
];

// --- Compute fingerprint for ETag + 304 ---
$size = filesize($path);
$mtime = filemtime($path);
$etag = sprintf('"%x-%x"', $size, $mtime);

// --- 304 Not Modified if client asks ---
$if_none_match = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
if ($if_none_match !== '' && trim($if_none_match) === $etag) {
    header('HTTP/1.1 304 Not Modified');
    header('ETag: ' . $etag);
    header('Cache-Control: private, max-age=31536000, immutable');
    exit;
}

// --- Send image ---
header('Content-Type: ' . $mime_types[$ext]);
header('Content-Length: ' . $size);
header('Cache-Control: private, max-age=31536000, immutable');
header('ETag: ' . $etag);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
header('Content-Disposition: inline; filename="' . $base . '"');
header('X-LiteSpeed-Cache-Control: no-cache'); // never let server cache auth'd content

$fp = fopen($path, 'rb');
if ($fp === false) {
    http_response_code(500);
    exit('IO error');
}
while (!feof($fp)) {
    echo fread($fp, 1024 * 64);
    flush();
}
fclose($fp);
