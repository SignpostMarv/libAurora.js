(function(window, document, undefined){
	var
		Addon                = window['Aurora']['Addon'],
		abstractAuthBasicAPI = Addon['abstractAuthBasicAPI'],
		WebAPI = function(serviceUrl, username, password){
			abstractAuthBasicAPI.prototype['constructor']['apply'](this, arguments);
		}
	;
	
	WebAPI.prototype = new abstractAuthBasicAPI();
	WebAPI.prototype['constructor'] = WebAPI;

	WebAPI.prototype['OnlineStatus'] = function(){
		this['makeCallToAPI']('OnlineStatus', true, undefined, {
			'Online'       : {'boolean' : []},
			'LoginEnabled' : {'boolean' : []}
		});
	}

	WebAPI.prototype['_GridInfo'] = undefined;
	WebAPI.prototype['get_grid_info'] = function(info){
		var
			obj = this,
			method = 'get_grid_info',
			cacheGridInfo = function(e){
				obj['_GridInfo'] = e['result']['GridInfo'];
				obj['removeListener'](method, cacheGridInfo);
			},
			fireInfo = function(e){
				obj['fire'](method + ':' + info, {
					'result' : e['result']['GridInfo'][info]
				});
				obj['removeListener'](method, fireInfo);
			}
		;
		if(typeof(info) == 'string'){
			obj['addListener'](method, fireInfo);
		}
		if(!obj['_GridInfo']){
			obj['addListener'](method, cacheGridInfo);
			obj['makeCallToAPI'](method, true, undefined, {
				'GridInfo' : {'object':[]}
			});
		}else{
			obj['fire'](method, {
				'result' : {'GridInfo' : obj['_GridInfo']}
			});
		}
	}

	WebAPI.prototype['CheckIfUserExists'] = function(name){
		this['makeCallToAPI']('CheckIfUserExists', true, {
			'Name' : name
		}, {
			'Verified' : {
				'boolean' : []
			}
		});
	}

	Addon['WebAPI'] = WebAPI;

})(window, window['document']);
