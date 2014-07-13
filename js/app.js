/** Non backbone attempt!! */

var $categories, $list, $details;
var hospitalList = [];
var thresholds = {
	'green' : 60,
	'amber' : 120,
	'red' : 200
};

$(function(){
	$categories = $('#categories .appbody');
	$list = $('#list .appbody'); 
	$details = $('#details .appbody');
	
	if (location.hash){
		location.hash = '';
	}
	$('.list .back, .set-state .back').click(function(event){
		event.preventDefault();
		Presenter.clearCategories();
		Presenter.viewCategories();
		$.mobile.navigate('#categories');
	});
	$('.details .back').click(function(event){
		event.preventDefault();
		Presenter.clearList();
		Presenter.viewList();
		$.mobile.navigate('#list');
	});
	$( window ).on( "navigate", function(event, data) {
		if (data.state.direction == 'back'){
			if (data.state.hash == '' || data.state.hash == '#categories'){
				Presenter.clearCategories();
				Presenter.viewCategories()
			}
			if (data.state.hash == '#list'){
				Presenter.clearList();
				Presenter.viewList();
			}
		}
	});
	
	// Option for changing state
	$('#choose-state-form [name=select-state]').change(function(){
		Presenter.activeState = $(this).val();
		$('.state-setting span').html(Presenter.activeState);
	});
	
	// Emergency Room toggle, display a message, reload the list, etc
	$('.er-toggle').click(function(){
		Presenter.emergencyOnly = !Presenter.emergencyOnly;
		if (Presenter.emergencyOnly){
			$(this).addClass('toggle-on');
			$('.er-entry').removeClass('hidden');
		}
		else {
			$(this).removeClass('toggle-on');
			$('.er-entry').addClass('hidden');
		}
		Presenter.clearList();
		Presenter.viewList();
	});
	
	Presenter.loadList();
	Presenter.viewCategories();
});

Presenter = {
	activeState : 'NSW',
	activeCategory : '',
	emergencyOnly : false,
	itemsPerPage : 10,
	listSize : 0,
	listPosition : 0,
	viewCategories : function(){
		Presenter.clearList();
		$.get('api/category', function(data){
			var $locality = $('<div class="setting-entry state-setting clearfix" role="button" data-transition="slidedown"><div class="entry-inner"><span>'+Presenter.activeState+'</span><small>Tap to change state</small></div></div>');
			$locality.click(function(event){
				event.preventDefault();
				$.mobile.navigate('#setstate');
				return false;
			});
			$categories.append($locality);
			for (x in data){
				if (Presenter.activeCategory == null){
					Presenter.activeCategory = x;
				}
				var $opt = $('<div class="cat-entry cat-'+x+' clearfix" data-category="'+x+'"><div class="entry-inner"><span>'+data[x]+'</span></div></div>');
				$opt.click(function(event){
					event.preventDefault();
					Presenter.activeCategory = $(this).data('category');
					Presenter.viewList();
					$.mobile.navigate('#list');
				});
				$categories.append($opt);
			}
		}, 'json');
	},
	viewList : function(){
		var listCounter = 0;
		for (x in hospitalList){
			var hosp = hospitalList[x];
			if (hosp.isState(Presenter.activeState) && hosp.isCategory(Presenter.activeCategory)){
				if (Presenter.emergencyOnly && !hosp.hasEmergency()){
					continue;
				}
				$list.append(hosp.renderListing());
				if (++listCounter >= Presenter.itemsPerPage){
					return;
				}
			}
		}
	},
	viewDetails : function(mhid){
		var hosp;
		for (x in hospitalList){
			if (hospitalList[x].isMhId(mhid)){
				hosp = hospitalList[x];
				break;
			}
		}
		if (hosp != null){
			hosp.renderDetails($details);
		}
		else {
			$details.find('.d-subtitle').html('Bad mhid serial number.');
		}
	},
	loadList : function(){
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(function(myPosition){
				$.get('api/hospital', function(data){
					for (x in data){
						var hosp = new Hospital(data[x]);
						var positioner = new Position(hosp, myPosition);
						positioner.calculateDistance();
						hospitalList.push(hosp);
					}
					hospitalList.sort(function(a,b){
						var sa = a.score();
						var sb = b.score();
						return sa - sb;
					});
				}, 'json');
			});
		} 
		else {
			// Todo: fallback for no geoloc, use a select dropdown or something to determine their state
			console.log("Geolocation is not supported by this browser.");
		}
	},
	clearCategories : function(){
		$categories.empty();
	},
	clearList : function(){
		$list.empty();
	}
};


// Objects etc
function Hospital(data){
	var h = data;
	this.coords = {
		latitude: data.lat, 
		longitude: data.long
	};
	this.distance = 0;
	
	this.setDistance = function(distance){
		this.distance = distance;
	};
	this.score = function(){
		var speed = 35;
		var numWait = isNaN(parseFloat(h.wait)) ? parseFloat(h.wait_state_avg) : parseFloat(h.wait) ;
		numWait = isNaN(numWait) ? 0 : numWait;
		return Math.ceil((this.distance/speed)*60 + numWait);
	};
	this.isState = function(state){
		return h.state.toUpperCase() === state.toUpperCase();
	};
	this.isMhId = function(mhid){
		return h.mhid == mhid;
	};
	this.isCategory = function(category){
		return h.category.toUpperCase() === category.toUpperCase();
	};
	this.isMedicare = function(medicareProviderNo){
		return (h.medicare+'') === medicareProviderNo;
	};
	this.hasEmergency = function(){
		return h.emergency == 'Yes';
	};
	this.renderListing = function(){
		var colorCode = 'black';
		var score = this.score();
		for (level in thresholds){
			if (score < thresholds[level]){
				colorCode = level;
				break;
			}
		}
		$entry = $('<div class="hosp-entry clearfix" data-medicare="'+h.medicare+'" data-mhid="'+h.mhid+'">');
		$entrySidebar = $('<div class="hosp-sidebar color-'+colorCode+'">');
		$entrySidebar.append('<div class="hosp-wait-total">'+score+'<small>min avg</small></div>');
		$entrySidebar.append('<div class="hosp-dist-wait">'+this.distance+' km<br>+'+(isNaN(parseInt(h.wait)) ? h.wait_state_avg : h.wait)+' min</div>');
		$entry.append($entrySidebar);
		$entry.append('<div class="entry-inner"><span>'+h.name+(h.emergency == 'Yes' ? '<small class="emergency-room">Emergency Room</small>' : '' )+'</span></div>');
		$entry.click(function(event){
			event.preventDefault();
			Presenter.viewDetails($(this).data('mhid'));
			$.mobile.navigate('#details');
		});
		return $entry;
	};
	this.renderDetails = function($template){
		$template.find('.d-subtitle').html(h.state + ' - Approximately ' + this.distance+' km away');
		$template.find('.d-name').html(h.name);
		$template.find('.d-peer').html(h.peer_group_name);
		$template.find('.d-this-average span').html((isNaN(parseInt(h.wait)) ? 'Unknown' : h.wait + ' min'));
		$template.find('.d-state-average span').html(h.wait_state_avg + ' min');
		$template.find('.d-medicare span').html(h.medicare);
		$template.find('.d-address span').html(h.full_address);
		$template.find('.d-area span').html(h.remoteness_area);
		$template.find('.d-beds span').html(h.num_beds);
		
		if (h.emergency == 'Yes'){
			$template.find('.d-emergency').addClass('yes');
		}
		if (h.elective == 'Yes'){
			$template.find('.d-elective').addClass('yes');
		}
		if (h.outpatient == 'Yes'){
			$template.find('.d-outpatient').addClass('yes');
		}
	}
	
}

function Position(hosp, myPosition){
	this.hosp = hosp;
	var mc = myPosition.coords;
	var hc = hosp.coords;
	
	this.calculateDistance = function(){
		var radlat1 = Math.PI * mc.latitude/180;
		var radlat2 = Math.PI * hc.latitude/180;
		var radlon1 = Math.PI * mc.longitude/180;
		var radlon2 = Math.PI * hc.longitude/180;
		
		var theta = mc.longitude-hc.longitude;
		var radtheta = Math.PI * theta/180;
		
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		dist = dist * 1.609344; // kilometre conversion
		dist = Math.ceil(dist);
		
		hosp.setDistance(dist);
	}
}
// 
