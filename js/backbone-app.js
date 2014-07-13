/** Backbonejs application for MyHospital app */
/** Alan Yeung */

$(function(){

	var Hospital = new Backbone.Model.extend({
		defaults: function(){
			return {
				
			}
		},
	
	});

	var HospitalList = Backbone.Collection.extend({
		url: 'hospital',
		model: Hospital,
		closest: function(){
			// Return the closest hospitals here
		}
	});


	var hospitals = new HospitalList();

	var HospitalView = Backbone.View.extend({
		tagName: 'div',
		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
		      	this.listenTo(this.model, 'destroy', this.remove);
			this.render();
		},
		render: function(){
			this.$el.html('<div>'+this.model.get('name')+'</div>');
			hospitals.fetch();
		}
	});

	var AppView = Backbone.View.extend({
		el: $('#app'),
		initialize: function(){
			hospitals.fetch();
		},
		addOne: function(hospital){
    			var view = new HospitalView({model: hospital});
      			this.$("#list").append(view.render().el);
    		},
		addAll: function(){
			hospitals.each(this.addOne, this);
		}
	});

	var app = AppView;
	app.addOne();

});
