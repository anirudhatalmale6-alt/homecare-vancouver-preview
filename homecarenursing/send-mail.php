<?php
/*
 * Enquiry mailer — Home Care Nursing
 * -------------------------------------------------------------------------
 * Self-contained. It does not depend on allnursing.ca's send-mail.php and it
 * does not use reCAPTCHA, so there is no site key to register and nothing to
 * copy across from another domain.
 *
 * Spam is handled two ways, both invisible to a real visitor:
 *   1. a honeypot field ("company") that is hidden by CSS - bots fill it in
 *   2. a minimum time-on-page check
 *
 * TO CHANGE WHERE ENQUIRIES GO: edit $TO below.
 * -------------------------------------------------------------------------
 */

$TO      = 'info@allnursing.ca';           // where enquiries are delivered
$SITE    = 'Home Care Nursing';
$DOMAIN  = 'homecarenursing.ca';

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('ERR: method');
}

/* --- honeypot: a real person never sees this field ---------------------- */
if (!empty($_POST['company'])) {
    exit('OK');                             // answer politely, deliver nothing
}

function field($key, $max = 2000) {
    $v = isset($_POST[$key]) ? $_POST[$key] : '';
    $v = str_replace(array("\r", "\n", "%0a", "%0d"), ' ', $v); // header injection
    return trim(mb_substr($v, 0, $max));
}

$name    = field('name', 120);
$phone   = field('phone', 60);
$email   = field('email', 160);
$area    = field('area', 120);
$timing  = field('timing', 120);
$message = trim(mb_substr(isset($_POST['message']) ? $_POST['message'] : '', 0, 4000));
$source  = field('source', 120);

if ($name === '' || $phone === '') {
    http_response_code(400);
    exit('ERR: name and phone are required');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $email = '';                            // keep the enquiry, drop the bad address
}

/* --- compose ------------------------------------------------------------ */
$subject = 'Website enquiry - ' . $SITE . ' - ' . $name;

$lines = array(
    'New enquiry from ' . $DOMAIN,
    str_repeat('-', 58),
    'Name        : ' . $name,
    'Phone       : ' . $phone,
    'Email       : ' . ($email !== '' ? $email : '(not given)'),
    'City/area   : ' . ($area !== '' ? $area : '(not given)'),
    'Timing      : ' . ($timing !== '' ? $timing : '(not given)'),
    '',
    'Message:',
    ($message !== '' ? $message : '(none)'),
    '',
    str_repeat('-', 58),
    'Sent  : ' . date('Y-m-d H:i:s T'),
    'Page  : ' . ($source !== '' ? $source : $DOMAIN),
    'IP    : ' . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '?'),
);
$body = implode("\n", $lines) . "\n";

/* The From: address must be on this domain or most hosts will refuse to
   relay it. The visitor's own address goes in Reply-To instead. */
$headers   = array();
$headers[] = 'From: ' . $SITE . ' <noreply@' . $DOMAIN . '>';
$headers[] = $email !== '' ? 'Reply-To: ' . $name . ' <' . $email . '>' : 'Reply-To: ' . $TO;
$headers[] = 'Content-Type: text/plain; charset=utf-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = @mail($TO, $subject, $body, implode("\r\n", $headers), '-f noreply@' . $DOMAIN);

/* --- always keep a copy on disk, whether or not mail() worked -----------
   Enquiries contain personal and health details, so this file must never be
   readable over the web. Three independent defences, because any one of them
   can quietly stop working:
     1. it is written ABOVE the document root wherever the host allows it
     2. if it cannot be, it falls back to private/, which ships with a deny-all
        .htaccess (and the site root .htaccess blocks the extension too)
     3. the file is named .php and begins with an exit guard, so even if a
        misconfigured server does serve it, the visitor gets an empty page
        instead of somebody's medical details
   Defence 3 is the one that holds when .htaccess is ignored - which is exactly
   what happens on nginx, or on Apache with AllowOverride None. */
$guard  = "<?php exit; /* enquiry log - not web readable */ ?>\n";
$above  = dirname(__DIR__) . '/private-' . $DOMAIN;
$inside = __DIR__ . '/private';

$dir = null;
if (@is_dir($above) || @mkdir($above, 0750, true)) {
    $dir = $above;                          // preferred: outside the web root
} elseif (@is_dir($inside) || @mkdir($inside, 0750, true)) {
    $dir = $inside;                         // fallback: inside, but guarded
}

if ($dir !== null) {
    $log = $dir . '/enquiries.log.php';
    if (!file_exists($log)) {
        @file_put_contents($log, $guard, LOCK_EX);
    }
    @file_put_contents(
        $log,
        "\n===== " . date('Y-m-d H:i:s') . ' mail()=' . ($sent ? 'ok' : 'FAILED') . " =====\n" . $body,
        FILE_APPEND | LOCK_EX
    );
}

if ($sent) {
    echo 'OK';
} else {
    http_response_code(500);
    echo 'ERR: mail() refused';
}
