<?php
// Vragen pagina - SWP Dashboard Plugin

// register [swp_dashboard_vragen] shortcode
function swp_dashboard_vragen_shortcode( $atts ) {
	global $swpdash_trello_token, $swpdash_smartlook_id, $swpdash_home_location;
	
	// shortcode attributes
    $a = shortcode_atts( array(
		'contact' => 'true',
    ), $atts );
	
	$boardid = get_user_meta(get_current_user_id(), "vragen_board_id", true);
	if (empty($boardid)) { die("Error met vragentool"); }
	
	// enqueue stylesheet + script for vragen
	wp_enqueue_style('swp-dashboard-vragen-style');
	wp_enqueue_script('swp-dashboard-vragen-script');
	
	// start vragen tool content wrapper
	$vragen_content = '<div id="swp-dashboard-vragen">';
	
	// back to dashboard button
	$vragen_content .= '<div id="back-to-dash"><a href="/'.$swpdash_home_location.'"><i class="fa fa-chevron-left" aria-hidden="true"></i><span>Dashboard</span></a></div>';
	
	// vragen tool main content
	$vragen_content .= '<aside id="status-bar" class="navbar navbar-default status">
</aside>
<div id="swp-vragen-container" class="container-fluid">
    <div class="row">
      <div class="col-md-6 col-md-offset-3">
        <h1 class="text-center">Openstaande vragen</h1>
      </div>
    </div>
    <div class="row text-center">
      <div class="col-md-6 col-md-offset-3">De vragen die wij stellen hebben één belangrijk doel voor ogen. Uw en onze tijd en energie zoveel mogelijk focussen op een succesvol afgerond project.<br/>Hieronder staan een aantal <strong>vragen</strong> die nog open staan. U kunt deze hier direct beantwoorden.</div>
    </div>
    <hr>
</div>
<div id="vragen-container" class="container"><div class="trello-uploading"></div></div>
<div id="laatste-stap" class="container">
	<div class="status">Alle antwoorden worden automatisch opgeslagen.</div>
</div>
<div id="progress-container" class="container">
  <div class="progress">
    <div id="progress-bar" class="progress-bar progress-bar-success empty" role="progressbar" style="width: 0%">0%</div>
  </div>
  <div id="honderd-procent"><h3>Bedankt, uw antwoorden zijn ontvangen.</h3>We nemen zo snel mogelijk contact met u op. <a href="/'.$swpdash_home_location.'">Terug naar Dashboard</a></div>
</div>';
	
	// end vragen tool content wrapper
	$vragen_content .= "</div>";
	
	// Board id
	$vragen_content .= "<script type='text/javascript'>
    var boardid = '".$boardid."';
	var trellotoken = '".$swpdash_trello_token."';
</script>";

	// return the generated content for openstaande vragen
    return $vragen_content;
}
add_shortcode( 'swp_dashboard_vragen', 'swp_dashboard_vragen_shortcode' );


?>