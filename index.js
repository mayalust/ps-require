(function(){
  var globalQueue = [];
  var loadCache = creatCached();
  function creatCached(){
    var keys = [];
    var cached = function(key, val){
      if(typeof val == "undefined"){
        return cached[" "+key];
      } else {
        keys.push( key );
        cached[" "+key] = val;
      }
    }
    cached.keys = function(){
      return keys;
    }
    return cached;
  }
  window.psrequire = function(deps, callback, error){
    var rs = [],
      loaders = {
        js : function(url, callback){
          if( loadCache(url) ){
            loadCache(url).remove();
            delete loadCache[ url ];
          }
          var module = {
              url : url
            },
            script = document.createElement("script");
          script.setAttribute("src" , url);
          script.setAttribute("type" , "text/javascript");
          document.head.appendChild(script);
          script.onload = function(e) {
            var execCb, rs;
            try {
              execCb = globalQueue.shift();
              rs = execCb ? execCb.call(module) : undefined;
            } catch( e ){
              error && error( e );
            }
            loadCache( url, script );
            callback( rs );
          }
          script.error = function(e) {
            error && error( e );
            //callback( undefined );
          }
        },
        css : function( url, callback ){
          if( loadCache(url) ){
            loadCache(url).remove();
            delete loadCache[ url ];
          }
          var link = document.createElement("link");
          link.setAttribute("rel" , "stylesheet");
          link.setAttribute("type" , "text/css");
          link.setAttribute("href" , url);
          document.head.appendChild(link);
          link.onload = function(e) {
            loadCache( url, link );
            callback( undefined );
          }
        }
      }
    deps = deps.reduce(function(a, b){
      var match = makeMatch(keys(loaders))( b ),
        basename = match ? match[1] : b,
        types = match ? match[2].split("|") : ["js"];
      return a.concat(types.map(function( type ){
        return {
          url : basename + "." + type,
          loader : loaders[ type ]
        };
      }));
    },[]);
    function keys(obj){
      var rs = [];
      for(var i in obj){
        rs.push(i);
      }
      return rs;
    }
    function makeMatch ( arr ){
      return function( str ){
        return new RegExp( "(.*)\\.((?:(?:(?:" + arr.join(")|(?:") + "))\\|)*(?:(?:" + arr.join(")|(?:") + ")))$" ).exec( str );
      }
    }
    function load( deps ){
      var dep = deps.shift();
      if( dep ){
        dep.loader( dep.url, function( d ) {
          typeof d !== "undefined" ? rs.push( d ) : null;
          load( deps );
        })
      } else {
        callback.apply(null, rs);
      }
    };
    load( deps )
  }
  window.psdefine = function(callback){
    globalQueue.push(callback);
  }
})()