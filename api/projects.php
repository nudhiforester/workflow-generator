<?php
/**
 * Workflow Generator - Project & User API
 * Mengelola penyimpanan project workflow dan data index user
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$baseDir = dirname(__DIR__);
$projectDir = $baseDir . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'json' . DIRECTORY_SEPARATOR . 'project';
$projectIndexFile = $projectDir . DIRECTORY_SEPARATOR . 'project_by_user.json';
$userFile = $baseDir . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'json' . DIRECTORY_SEPARATOR . 'user.json';

// Pastikan folder project ada
if (!is_dir($projectDir)) {
    mkdir($projectDir, 0777, true);
}

// Pastikan file index ada
if (!file_exists($projectIndexFile) || filesize($projectIndexFile) === 0) {
    file_put_contents($projectIndexFile, json_encode(new stdClass(), JSON_PRETTY_PRINT));
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Ambil input JSON jika method POST
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $input = json_decode($rawInput, true) ?? [];
    }
    if (empty($input) && !empty($_POST)) {
        $input = $_POST;
    }
    if (empty($action) && isset($input['action'])) {
        $action = $input['action'];
    }
}

// Helper sanitasi nama file
function sanitizeFilename($filename) {
    $clean = basename($filename);
    if (!preg_match('/^[a-zA-Z0-9_\-]+\.json$/', $clean)) {
        return null;
    }
    return $clean;
}

// Helper membaca index project
function getProjectIndex($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }
    $content = file_get_contents($filePath);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

// Helper menyimpan index project
function saveProjectIndex($filePath, $data) {
    return file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

switch ($action) {
    case 'login':
        $emailInput = $input['email'] ?? '';
        $passwordInput = $input['password'] ?? '';
        $email = is_string($emailInput) ? trim($emailInput) : '';
        $password = is_string($passwordInput) ? $passwordInput : '';

        if ($email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email dan password wajib diisi.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Format email tidak valid.']);
            exit;
        }

        $userData = [];
        if (!is_file($userFile) || !is_readable($userFile)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Data pengguna tidak dapat dibaca. Periksa data/json/user.json dan jalankan setup.']);
            exit;
        }
        $userData = json_decode(file_get_contents($userFile), true);
        if (!is_array($userData)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Format data/json/user.json tidak valid.']);
            exit;
        }

        $matchedUser = null;
        $emailLower = strtolower($email);

        // 1. Cek semua entri di user.json
        if (is_array($userData)) {
            foreach ($userData as $key => $u) {
                if (is_array($u)) {
                    $uEmail = strtolower((string)($u['email'] ?? ''));
                    if ($uEmail === $emailLower && (string)($u['password'] ?? '') === $password) {
                        $matchedUser = $u;
                        break;
                    }
                }
            }
        }

        if ($matchedUser) {
            unset($matchedUser['password']);
            echo json_encode(['success' => true, 'user' => $matchedUser]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Kombinasi email atau password salah.']);
        }
        break;

    case 'list':
        $userEmail = trim($_GET['user'] ?? $input['user'] ?? '');
        if (empty($userEmail)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Parameter user email dibutuhkan.']);
            exit;
        }

        $index = getProjectIndex($projectIndexFile);
        $userProjects = $index[$userEmail] ?? [];
        echo json_encode(['success' => true, 'projects' => $userProjects]);
        break;

    case 'get':
        $filename = sanitizeFilename($_GET['file'] ?? '');
        if (!$filename) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nama file tidak valid.']);
            exit;
        }

        $targetFile = $projectDir . DIRECTORY_SEPARATOR . $filename;
        if (!file_exists($targetFile)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Project file tidak ditemukan.']);
            exit;
        }

        $content = file_get_contents($targetFile);
        echo $content;
        break;

    case 'save':
        $user = $input['user'] ?? [];
        $userEmail = trim($user['email'] ?? '');
        $projectName = trim($input['project_name'] ?? 'Untitled Workflow');
        $workflow = $input['workflow'] ?? ['nodeDataArray' => [], 'linkDataArray' => []];

        if (empty($userEmail)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identitas user email dibutuhkan.']);
            exit;
        }

        $filename = sanitizeFilename($input['filename'] ?? '');
        $isNew = false;
        $now = date('Y-m-d H:i:s');
        $isoDate = date('c');

        // Jika file belum ada atau kosong, buat nama file sesuai tanggal, waktu hingga detik agar unik
        if (!$filename) {
            $isNew = true;
            $timestampName = date('Y-m-d_H-i-s');
            $filename = $timestampName . '.json';
            $id = $timestampName;
            $createdAt = $isoDate;
        } else {
            $id = pathinfo($filename, PATHINFO_FILENAME);
            $createdAt = $input['created_at'] ?? $isoDate;
        }

        $projectPayload = [
            'id' => $id,
            'filename' => $filename,
            'project_name' => $projectName,
            'user' => [
                'username' => $user['username'] ?? 'User',
                'email' => $userEmail
            ],
            'created_at' => $createdAt,
            'updated_at' => $isoDate,
            'workflow' => $workflow
        ];

        $targetFile = $projectDir . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($targetFile, json_encode($projectPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // Update project_by_user.json
        $index = getProjectIndex($projectIndexFile);
        if (!isset($index[$userEmail])) {
            $index[$userEmail] = [];
        }

        // Cari apakah project sudah ada di index
        $foundIndex = -1;
        foreach ($index[$userEmail] as $idx => $p) {
            if (($p['filename'] ?? '') === $filename || ($p['id'] ?? '') === $id) {
                $foundIndex = $idx;
                break;
            }
        }

        $projectSummary = [
            'id' => $id,
            'filename' => $filename,
            'name' => $projectName,
            'created_at' => $createdAt,
            'updated_at' => $isoDate
        ];

        if ($foundIndex >= 0) {
            $index[$userEmail][$foundIndex] = $projectSummary;
        } else {
            array_unshift($index[$userEmail], $projectSummary);
        }

        saveProjectIndex($projectIndexFile, $index);

        echo json_encode([
            'success' => true,
            'message' => 'Project berhasil disimpan.',
            'project' => $projectPayload
        ]);
        break;

    case 'delete':
        $userEmail = trim($input['user']['email'] ?? '');
        $filename = sanitizeFilename($input['filename'] ?? '');

        if (!$filename || empty($userEmail)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Filename dan user email dibutuhkan.']);
            exit;
        }

        $targetFile = $projectDir . DIRECTORY_SEPARATOR . $filename;
        if (file_exists($targetFile)) {
            unlink($targetFile);
        }

        $index = getProjectIndex($projectIndexFile);
        if (isset($index[$userEmail])) {
            $index[$userEmail] = array_values(array_filter($index[$userEmail], function ($p) use ($filename) {
                return ($p['filename'] ?? '') !== $filename;
            }));
            saveProjectIndex($projectIndexFile, $index);
        }

        echo json_encode(['success' => true, 'message' => 'Project berhasil dihapus.']);
        break;

    case 'profile_update':
        $user = $input['user'] ?? [];
        $email = trim($user['email'] ?? '');
        $name = trim($user['username'] ?? '');
        $contact = trim($user['contact'] ?? '');
        $password = trim($user['password'] ?? '');

        if (empty($email)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email tidak boleh kosong.']);
            exit;
        }

        $userData = [];
        if (file_exists($userFile)) {
            $userData = json_decode(file_get_contents($userFile), true) ?? [];
        }

        if (!isset($userData['default_user'])) {
            $userData['default_user'] = [];
        }

        if (!empty($name)) $userData['default_user']['username'] = $name;
        if (!empty($contact)) $userData['default_user']['contact'] = $contact;
        if (!empty($password)) $userData['default_user']['password'] = $password;
        $userData['default_user']['updated_at'] = date('c');

        file_put_contents($userFile, json_encode($userData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $safeUser = $userData['default_user'];
        unset($safeUser['password']);
        echo json_encode(['success' => true, 'message' => 'Profil berhasil diperbarui.', 'user' => $safeUser]);
        break;

    default:
        echo json_encode([
            'status' => 'online',
            'app' => 'Workflow Generator API',
            'time' => date('c')
        ]);
        break;
}
