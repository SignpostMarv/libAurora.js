/**
* @license libAurora.js Copyright (c) 2011-2012 Contributors
* See CONTRIBUTORS.TXT for a full list of copyright holders.
* MIT License
*/
(function(window, document, undefined){
	var
		EventTarget      = window['EventTarget'],
		Aurora           = window['Aurora'] || {},
		Addon            = Aurora['Addon'] || {},
		JSON             = window['JSON'],
		md5              = window['md5'],
		is_array         = window['is_array'],
		array_keys       = window['array_keys'],
		base64_encode    = window['base64_encode'],
		XMLHttpRequest   = window['XMLHttpRequest'],
		http_build_query = window['http_build_query'],
		validateJSONResponse = function(result, expectedResponse){
			if(!(typeof(result) == 'string')){
				throw new TypeError('API result expected to be a string, ' + typeof(result) + ' found.');
			}else{
				var
					result = JSON['parse'](result),
					expectedResponse = expectedResponse || []
				;
				if(typeof(result) != 'object'){
					throw new TypeError('API result expected to be an object, ' + typeof(result) + ' found.');
				}else if(!is_array(expectedResponse)){
					throw new TypeError('Expected Response argument must be specified as an array, not ' + typeof(expectedResponse));
				}
				expectedResponse['forEach'](function(v, k){
					if(!(k in result)){
						throw new Error('Call to API was successful, but required response properties were missing.');
					}else if(array_keys(v)['indexOf'](typeof(result[k])) < 0){
						throw new Error('Call to API was successful, but required response property was of unexpected type.');
					}else if(v[typeof(result[k])] && v[typeof(result[k])]['length'] > 0){
						var
							validValue = false
						;
						v[typeof(result[k])]['forEach'](function(possibleValue, _k){
							if(typeof(_k) == 'number'){
								if(typeof(result[k]) == 'boolean'){
									if(!typeof(possibleValue)){
										throw new TypeError('Only booleans can be given as valid values to a boolean type.');
									}else if(result[k] == possibleValue){
										validValue = true;
										return;
									}
								}else{
									var
										subPropertyKeys = array_keys(possibleValue),
										rkType = typeof(result[k]) == 'object' ? (!is_array(result[k]) ? 'object' : 'array') : typeof(result[k]);
									;
									switch(typeof(rkType)){
										case 'array':
											result[k]['forEach'](function(_v){
												var
													_v_Type = typeof(_v)
												;
												if(subPropertyKeys['indexOf'](_v_Type) < 0){
													throw new TypeError('Call to API was successful, but required response sub-property was of unexpected type.');
												}else if(_v_Type == 'object' && !!possibleValue[_v_Type]){
													var
														pos = possibleValue[_v_Type]
													;
													if(_v_Type == 'object'){
														pos = first(pos);
													}
													if(!!pos){
														pos['forEach'](function(__v, __k){
															if(!_v[__k]){
																throw new Error('Call to API was successful, but required response sub-property property was of missing.');
															}else{
																if(array_keys['indexOf'](typeof(_v[__k])) < 0){
																	throw new TypeError('Call to API was successful, but required response sub-property was of unexpected type.');
																}
															}
														});
													}
												}
											});
											validValue = true;
										break;
										case 'object':
											possibleValue['forEach'](function(_v, _k){
												if(!result[k][_k]){
													throw new Error('Call to API was successful, but required response sub-property property was of missing.');
												}else{
													if(array_keys(possibleValue[_k])['indexOf'](typeof(result[k][_k])) < 0){
														throw new TypeError('Call to API was successful, but required response sub-property was of unexpected type.');
													}
												}
											});
											validValue = true;
										break;
									}
								}
							}else if(result[k] == possibleValue){
								validValue = true;
								return;
							}
						});
						if(!validValue){
							throw new Error('Call to API was successful, but required response property had an unexpected value.');
						}
					}
				});
				return result;
			}
		},
		abstractAPI = function(){
		},
		abstractPasswordAPI = function(serviceUrl, password){
			var
				obj = this
			;
			obj['_serviceURL'] = serviceUrl;
			obj['_password'] = md5(password);
		},
		abstractUsernamePasswordAPI = function(serviceUrl, username, password){
			var
				obj = this
			;
			abstractPasswordAPI.prototype['constructor']['apply'](obj, [serviceUrl, password]);
			obj['_username'] = username;
		},
		abstractAuthBasicAPI = function(serviceUrl, username, password){
			abstractUsernamePasswordAPI.prototype['constructor']['apply'](this, arguments);
		},
		first = function(array){
			var
				array = array || []
			;
			for(var key in array){
				return array[key];
			}
		}
	;
	if(!JSON || !JSON['parse'] || !JSON['stringify']){
		throw new Error('Your browser cannot parse JSON srings.');
	}
	
	abstractAPI.prototype = new EventTarget();
	abstractAPI.prototype['constructor'] = abstractAPI;

	abstractAPI.prototype['attachedAPIs'] = {};
	abstractAPI['validateJSONResponse'] = validateJSONResponse;

	abstractPasswordAPI.prototype = new abstractAPI();
	abstractPasswordAPI.prototype['constructor'] = abstractPasswordAPI;

	abstractUsernamePasswordAPI.prototype = new abstractPasswordAPI();
	abstractUsernamePasswordAPI.prototype['constructor'] = abstractUsernamePasswordAPI;

	abstractAuthBasicAPI.prototype = new abstractUsernamePasswordAPI();
	abstractAuthBasicAPI.prototype['constructor'] = abstractAuthBasicAPI;

	abstractAuthBasicAPI.prototype['makeCallToAPI'] = function(method, readOnly, args, expectedResponse){
		if(!XMLHttpRequest){
			throw new Error('Your browser does not support XMLHttpRequest');
		}
		var
			obj       = this,
			readOnly  = readOnly || false,
			args      = args || [],
			ch        = new XMLHttpRequest(),
			authTried = false
		;
		if(!!readOnly){
			args['forEach'](function(v, k){
				args[k] = JSON['stringify'](v);
			});
		}
		ch['open'](
			(!!readOnly) ? 'GET' : 'POST',
			obj['_serviceURL'] + '/' + escape(method) + ((!!readOnly) ? '?' + http_build_query(args) : ''),
			true,
			obj['_username'],
			obj['_password']
		);
		ch['setRequestHeader']('Authorization', 'Basic ' + base64_encode(obj['_username'] + ':' + obj['_password']));
		ch['addEventListener']('load', function(){
			if(ch['status'] == 200){
				try{
					obj['fire'](method, {
						'result' : validateJSONResponse(ch['responseText'])
					});
				}catch(e){
					obj['fire']('error', {
						'method' : method,
						'error' : e
					});
				}
			}else{
				switch(ch['status']){
					case 403:
						obj['fire']('error', {
							'method' : method,
							'error' : 'Access to the API method for the configured credentials has been denied.'
						});
					break;
					case 429:
						obj['fire']('error', {
							'method' : method,
							'error' : 'Reached hourly rate limit.'
						});
					break;
					default:
						obj['fire']('error', {
							'method' : method,
							'error' : 'Unknown error occurred.'
						});
					break;
				}
			}
		}, true);
		ch['send']();
	};

	window['Aurora'] = Aurora;
	Aurora['Addon'] = Addon;
	Addon['abstractAPI'] = abstractAPI;
	Addon['abstractPasswordAPI'] = abstractPasswordAPI;
	Addon['abstractUsernamePasswordAPI'] = abstractUsernamePasswordAPI;
	Addon['abstractAuthBasicAPI'] = abstractAuthBasicAPI;
})(window, window['document']);
