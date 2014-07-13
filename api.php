<?php

// Quick and dirty backend
// GovHack 2014

@list($item, $id) = explode('/', $_GET['arg']);

if ($item == 'category' && empty($id)){
	categories();
}
if ($item == 'hospital' && empty($id)){
	hospitals();
}


function categories(){
	echo json_encode(array(
		'pr' => 'Principal Referral',
		'lg' => 'Larger Facilities',
		'sm' => 'Smaller Facilities',
		'wc' => 'Women and Childrens',
		'sp' => 'Specialist'
	));
}

function hospitals(){
	// Reading a csv, need header definitions
	$headers = array(
		'mhid',
		'state', // "State",
		'name', //"Hospname" ,
		'wait',
		'id', // "Establishment ID",
		'parent_id', //"Parent Id",
		'use_default_wait_time',
		'wait_state_avg',
		'unit', //"Unit",
		'medicare', //"Medicare Prov Number",
		'address_line_1', //"Address Line 1",
		'address_line_2', //"Address Line 2",
		'lat',
		'long',
		'aus',
		'full_address',
		'remoteness_area_code', // "Remoteness area (code)",
		'remoteness_area', //"Remoteness area ",
		'num_beds', //"Number of available beds",
		'peer_group_code', //"2012-13 Peer Group code",
		'peer_group_name', //"2012-13 Peer Group Name",
		'admissions', //"Admissions reported",
		'emergency', //"Emergency department",
		'elective_surgery', // "Elective surgery reported",
		'outpatient', //"Outpatient clinics",
		'peer_group_code_2012', //"2011-12 Peer Group code",
		'peer_group_name_2012', //"2011-12 Peer Group Name"
		'category', //App category
	);


	// If co-ordinates are given
	if (isset($_GET['latlong'])){
		list($lat, $long) = explode(',', $_GET['latlong']);
	}
	else {
		$hospList = explode(PHP_EOL, file_get_contents('data/hosp.csv'));
		$all = array();
		array_shift($hospList);
		foreach ($hospList as $hosp){
			$cols = str_getcsv($hosp);
			if (sizeof($headers) == sizeof($cols)){
				$all[] = array_combine($headers, $cols);
			}
		}


		echo json_encode($all);
		exit;
	}
}