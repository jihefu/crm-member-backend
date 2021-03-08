// don't try to learn anything from the code, it's a
// series of hacks. this one's all about the visuals.
// - @hakimel
// setTimeout(function(){
//     setInterval(function(){
//     append();
//   },200);
//   },500);
var LineChart = function( options ) {

  var data = options.data;
  var canvas = document.getElementsByTagName('canvas')[options.index];
  var context = canvas.getContext( '2d' );
  var _w = $('#main').width();
  var _h = $('#main').height()-70;

  var rendering = false,
      paddingX = 30,
      paddingY = 20,
      width = _w,
      height = _h,
      progress = 0;
  if(options.index==0){
    height = _h;
  }else if(options.index==1){
    height = _h-100;
  }else{
    height = _h-200;
  }
  canvas.width = width;
  canvas.height = height;

  var maxValue,
      minValue;

  // var y1 = paddingY + ( 0.05 * ( height - ( paddingY * 2 ) ) ),
  //     y2 = paddingY + ( 0.50 * ( height - ( paddingY * 2 ) ) ),
  //     y3 = paddingY + ( 0.95 * ( height - ( paddingY * 2 ) ) );
  var y1 = height-20,
      y2 = height/2,
      y3 = 0;

  format();
  render();
  
  function format( force ) {
    maxValue = 0;
    minValue = Number.MAX_VALUE;
    
    data.forEach( function( point, i ) {
      maxValue = Math.max( maxValue, point.value );
      minValue = Math.min( minValue, point.value );
    } );

    data.forEach( function( point, i ) {
      point.targetX = paddingX + ( i / ( data.length - 1 ) ) * ( width - ( paddingX * 2 ) );
      point.targetY = paddingY + ( ( point.value - minValue ) / ( maxValue - minValue ) * ( height - ( paddingY * 2 ) ) );
      point.targetY = height - point.targetY;
  
      if( force || ( !point.x && !point.y ) ) {
        point.x = point.targetX + 30;
        point.y = point.targetY;
        point.speed = 0.04 + ( 1 - ( i / data.length ) ) * 0.05;
      }
    } );

  }

  function render() {
    if( !rendering ) {
      requestAnimationFrame( render );
      return;
    }
    
    context.font = '12px sans-serif';
    context.clearRect( 0, 0, width, height );

    context.fillStyle = '#222';   //横线
    if(options.index==2){
      context.fillRect( paddingX, y1, width - ( paddingX * 2 -20 ), 1 );
    }
    context.fillRect( paddingX, y1, 1, -height );
    
    //无用
    if( options.yAxisLabel ) {
      context.save();
      context.globalAlpha = progress;
      context.translate( paddingX - 15, height - paddingY - 10 );
      context.rotate( -Math.PI / 2 );
      context.fillStyle = '#fff';
      context.fillText( options.yAxisLabel, 0, 0 );
      context.restore();
    }

    var progressDots = Math.floor( progress * data.length );
    var progressFragment = ( progress * data.length ) - Math.floor( progress * data.length );

    data.forEach( function( point, i ) {
      if( i <= progressDots ) {
        point.x += ( point.targetX - point.x ) * point.speed;
        point.y += ( point.targetY - point.y ) * point.speed;

        context.save();
        
        var wordWidth = context.measureText( point.label ).width;
        context.globalAlpha = i === progressDots ? progressFragment : 1;
        context.fillStyle = point.future ? '#aaa' : '#fff';
        context.fillText( point.label, point.x - ( wordWidth / 2 ), height - 18 );

        //无用
        if( i < progressDots && !point.future ) {
          context.beginPath();
          context.arc( point.x, point.y, 4, 0, Math.PI * 2 );
          context.fillStyle = '#1baee1';
          context.fill();
        }

        context.restore();
      }

    } );

    context.save();
    context.beginPath();
    // context.strokeStyle = '#1baee1';
    context.lineWidth = 1;

    var futureStarted = false;

    data.forEach( function( point, i ) {

      if( i <= progressDots ) {

        var px = i === 0 ? data[0].x : data[i-1].x,
            py = i === 0 ? data[0].y : data[i-1].y;

        var x = point.x,
            y = point.y;

        if( i === progressDots ) {
          x = px + ( ( x - px ) * progressFragment );
          y = py + ( ( y - py ) * progressFragment );
        }

        if( point.future && !futureStarted ) {
          futureStarted = true;

          context.stroke();
          context.beginPath();
          context.moveTo( px, py );
          // context.strokeStyle = '#aaa';
          if(options.index==0){
            context.strokeStyle = '#00f';
          }else if(options.index==1){
            context.strokeStyle = '#f00';
          }else{
            context.strokeStyle = '#0f0';
          }

          if( typeof context.setLineDash === 'function' ) {
            // context.setLineDash( [2,3] );
          }
        }

        if( i === 0 ) {
          context.moveTo( x, y );
        }
        else {
          context.lineTo( x, y );
        }

      }

    } );

    context.stroke();
    context.restore();

    progress += ( 1 - progress ) * 0.02;
  
  	requestAnimationFrame( render );
    
  }
  
  this.start = function() {
    rendering = true;
  }
  
  this.stop = function() {
    rendering = false;
    progress = 0;
    format( true );
  }
  
  this.restart = function() {
    this.stop();
    this.start();
  }
  
  this.append = function( points ) {  
    progress -= points.length / data.length;
    data = data.concat( points );

    format();
  }
  
  this.populate = function( points ) {    
    progress = 0;
    data = points;
    
    format();
  }

};

function append() {
  chart.append([
    { label: '', value: 1 + ( Math.random() * 100 ), future: true }
  ]);
  chart2.append([
    { label: '', value: 1 + ( Math.random() * 50 ), future: true }
  ]);
  chart3.append([
    { label: '', value: 0 + ( Math.random() * 1 ), future: true }
  ]);
}

function restart() {
  chart.restart();
  chart2.restart();
  chart3.restart();
}

// function reset() {
//   chart.populate([
//     { label: 'One', value: 0 },
//     { label: 'Two', value: 100 },
//     { label: 'Three', value: 200 },
//     { label: 'Four', value: 840 },
//     { label: 'Five', value: 620 },
//     { label: 'Six', value: 500 },
//     { label: 'Seven', value: 600 },
//     { label: 'Eight', value: 1100 },
//     { label: 'Nine', value: 800 },
//     { label: 'Ten', value: 900 },
//     { label: 'Eleven', value: 1200, future: true },
//     { label: 'Twelve', value: 1400, future: true }
//   ]);
// }

function reset() {
  chart.populate([
    { label: '', value: 0, future: true }
  ]);
  chart2.populate([
    { label: '', value: 0, future: true }
  ]);
  chart3.populate([
    { label: '', value: 0, future: true }
  ]);
}


var chart = new LineChart({ 
  data: [],
  index: 0
});
var chart2 = new LineChart({ 
  data: [],
  index: 1
});
var chart3 = new LineChart({ 
  data: [],
  index: 2
});

reset();

chart.start();
chart2.start();
chart3.start();