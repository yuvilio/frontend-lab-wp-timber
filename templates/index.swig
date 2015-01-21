<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{name}}</title>
<link rel="stylesheet" href="/{{themePath}}/dist/{{batch}}/{{name}}/css/styles.css">
<script src="/{{themePath}}/dist/{{batch}}/{{name}}/js/source.js"></script>


{# browserSync snippet . adjust as needed#}

<script type='text/javascript' id="__bs_script__">//<![CDATA[
document.write("<script async src='//HOST:4286/browser-sync/browser-sync-client.1.9.0.js'><\/sc\
ript>".replace(/HOST/g, location.hostname).replace(/PORT/g, location.port));
//]]></script>


</head>
<body>

<h1>{{name}}</h1>

</body>
</html>
