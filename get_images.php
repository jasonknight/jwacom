<?php
$dirs = $dirs = array_filter(glob('./images/*'), 'is_dir');
foreach ( $dirs as $dir ) {
	$cpy = file_get_contents( $dir . '/copyright.txt');
	$images = glob($dir ."/*.jpg");
	foreach ( $images as $image ) {
		$name = basename($image);
		include "./_image.php";
	}
}