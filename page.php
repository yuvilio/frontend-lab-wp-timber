<?php

//create a page in the wp-admin, get it's id
$data = Timber::get_context();
$post = new TimberPost();
$data['post'] = $post;

//can add templates here

if ($post->ID == 7 OR $post->post_name == "test") {
  Timber::render( 'test.twig', $data );
} elseif ($post->ID == 57 OR $post->post_name == "test-009-test-page") {
  Timber::render( './lab/test/009-test-page/views/test-009-test-page.twig', $data );
}
 else {
  Timber::render( 'page.twig', $data );
}
?>
