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
  window.psrequire = function(deps, callback){
    var rs = [],
      loaders = {
        js : function(url, callback){
          if( loadCache(url) ){
            callback( loadCache(url) );
            return;
          }
          var module = {
              url : url
            },
            script = document.createElement("script");
          script.setAttribute("src" , url);
          script.setAttribute("type" , "text/javascript");
          document.head.appendChild(script);
          script.onload = function(e) {
            var execCb = globalQueue.shift();
            loadCache( url, execCb.call(module) );
            callback( loadCache( url ) );
          }
        },
        css : function( url, callback ){
          if( loadCache(url) ){
            callback( loadCache(url) );
            return;
          }
          var link = document.createElement("link");
          link.setAttribute("rel" , "stylesheet");
          link.setAttribute("type" , "text/css");
          link.setAttribute("href" , url);
          document.head.appendChild(link);
          link.onload = function(e) {
            loadCache( url , true );
            callback( loadCache( url ) );
          }
        }
      }
    deps = deps.map( function( dep ){
      var match = makeMatch(keys(loaders))( dep ),
        type = match ? match[1] : null;
      return {
        url : type ? dep : dep + ".js",
        loader : loaders[type || "js"]
      };
    });
    function keys(obj){
      var rs = [];
      for(var i in obj){
        rs.push(i);
      }
      return rs;
    }
    function makeMatch ( arr ){
      return function( str ){
        return new RegExp( "\\.((" + arr.join(")|(?:") + "))$" ).exec( str );
      }
    }
    function load( deps ){
      var dep = deps.shift();
      if( dep ){
        dep.loader( dep.url, function( d ) {
          rs.push( d );
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