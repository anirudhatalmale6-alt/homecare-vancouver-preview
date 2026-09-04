<?php
/*
 * saved.php - "did my edit actually save?"
 *
 * Built 4 Sep 2026 after a set of the owner's text edits went missing. It reads
 * nothing but the modification date of the site's own pages and prints them
 * newest first, so after saving an edit he can tap one link on his phone and see
 * whether the file he just edited actually changed.
 *
 * Deliberately takes NO parameters - no path can be passed in, the folder list
 * is fixed below. It only reads; it never writes or deletes.
 */
header('X-Robots-Tag: noindex, nofollow', true);
date_default_timezone_set('America/Vancouver');

$dirs = array('.', 'blog', 'services', 'locations', 'homecarevancouver', 'homecarenursing');
$rows = array();
foreach ($dirs as $d) {
    $path = __DIR__ . '/' . $d;
    if (!is_dir($path)) continue;
    foreach (scandir($path) as $f) {
        if (substr($f, -5) !== '.html') continue;
        $full = $path . '/' . $f;
        if (!is_file($full)) continue;
        $rows[] = array(
            'name' => ($d === '.' ? '' : $d . '/') . $f,
            'time' => filemtime($full),
            'size' => filesize($full),
        );
    }
}
usort($rows, function ($a, $b) { return $b['time'] - $a['time']; });
$now = time();
?><!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>When each page was last saved</title>
<style>
body{margin:0;background:#fff;color:#1f2421;
  font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
.wrap{max-width:640px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:1.25rem;margin:0 0 4px}
p.sub{color:#5f6863;font-size:.9rem;margin:0 0 20px}
ul{list-style:none;margin:0;padding:0}
li{border-bottom:1px solid #e6e8e6;padding:10px 2px;display:flex;
  justify-content:space-between;gap:12px;align-items:baseline}
b{font-weight:600;word-break:break-all}
span{color:#5f6863;font-size:.85rem;white-space:nowrap;text-align:right}
li.hot span{color:#2F6B3A;font-weight:600}
.note{background:#f6f7f6;border-left:3px solid #47593F;padding:12px 14px;
  border-radius:0 6px 6px 0;font-size:.9rem;margin:0 0 20px}
@media (prefers-color-scheme:dark){
  body{background:#141614;color:#e4e6e3}
  li{border-bottom-color:#2c2f2c}p.sub,span{color:#a3a9a4}.note{background:#1c1e1c}
  li.hot span{color:#8fce9c}
}
</style>
</head>
<body>
<div class="wrap">
<h1>When each page was last saved</h1>
<p class="sub">Server time now: <?php echo date('D j M, g:ia'); ?> (Vancouver)</p>

<div class="note">Edit a page, save it, then reload this list. If the page you
just edited is not at the top with a time of a minute or two ago, the save did
not reach the live site and the text will not appear.</div>

<ul>
<?php foreach (array_slice($rows, 0, 40) as $r):
    $mins = ($now - $r['time']) / 60;
    $hot  = $mins < 60 ? ' class="hot"' : '';
    if ($mins < 90)          $ago = round($mins) . ' min ago';
    elseif ($mins < 60 * 36) $ago = round($mins / 60) . ' hours ago';
    else                     $ago = round($mins / 1440) . ' days ago';
?>
  <li<?php echo $hot; ?>>
    <b><?php echo htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8'); ?></b>
    <span><?php echo date('j M g:ia', $r['time']); ?><br><?php echo $ago; ?></span>
  </li>
<?php endforeach; ?>
</ul>
<p class="sub"><?php echo count($rows); ?> pages. Newest first.</p>
</div>
</body>
</html>
