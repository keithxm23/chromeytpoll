// These are variables for YT elements related to chat.
// We expose them here so changes can be easily made if YT changes them.
ytChatIdentifier = "#items.yt-live-chat-item-list-renderer";
ytChatMessageClass = ".yt-live-chat-item-list-renderer";
ytPlayer = "#player.ytd-watch-flexy";
ytInner = "#columns #primary #primary-inner";
ytChatInner = "#chat-messages";

//from https://gist.github.com/0x263b/2bdd90886c2036a1ad5bcf06d6e6fb37
String.prototype.toHex = function() {
  var hash = 0;
  if (this.length === 0) return hash;
  for (var i = 0; i < this.length; i++) {
      hash = this.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
  }
  var color = '#';
  for (var i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 255;
      color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

/**
 * MIT Licensed
 * Author: jwilson8767
 * Waits for an element satisfying selector to exist, then resolves promise with the element.
 * Useful for resolving race conditions.
 *
 * @param selector
 * @returns {Promise}
 */
function elementReady(selector) {
  return new Promise((resolve, reject) => {
    let el = document.querySelector(selector);
    if (el) {resolve(el);}
    new MutationObserver((mutationRecords, observer) => {
      // Query for elements matching the specified selector
      Array.from(document.querySelectorAll(selector)).forEach((element) => {
        resolve(element);
        //Once we have resolved we don't need the observer anymore.
        observer.disconnect();
      });
    })
      .observe(document.documentElement, {
        childList: true,
        subtree: true
      });
  });
}


const regx = new RegExp("^([Oo0](-[Oo0]){1,2}|[KkQqRrBbNn]?[a-h]?[1-8]?x?[a-h][1-8](\=[QRBN])?[+#]?){1}$");
function findChessMove(message) {
  message = message.toLowerCase();
  message = message.trim();
  message = message.replace('x','')
  message = message.replace('×','')
  message = message.replace('#','')
  message = message.replace('+','')
  message = message.replace('?','')
  message = message.replace('!','')
  message = message.replace('.','')
  match = regx.exec(message);
  if(match){
    return match[0];
  }
  return null;
}

// elementReady(ytPlayer).then((element)=>{
//   //console.log(element);
//   //element.remove();
// });

//https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
// function inIframe () {
//   try {
//       return window.self !== window.top;
//   } catch (e) {
//       return true;
//   }
// }

function startApp(){
  this.style.display = 'none';

  var running_status = true;
  var show_non_move = true;
  console.log('started..');
  var move_data = {}; //FORMAT: {{'author':author1, 'move':move1}, ...};
  var mdata_by_move = {}; //FORMAT {'move1':['author1', 'author2'], 'move2':['author3'],...}
  master_guess_count = 0;
  TOOLTIP_LIMIT = 10;

  elementReady(ytChatIdentifier).then((element)=>{
    // console.log(element);
  
    element.arrive(ytChatMessageClass, function() {
      if (running_status){
        // 'this' refers to the newly created element
        //console.log(this);
        message = this.querySelector("#content #message.yt-live-chat-text-message-renderer").innerHTML;
        author = this.querySelector("#content .yt-live-chat-text-message-renderer #author-name").childNodes[0].nodeValue;
        // console.log(author, message);
        move = findChessMove(message);
        if (move){
          // console.log('found move', move);
          move_data[author] = {'author':author, 'move':move};
          this.style['border-left'] = "5px solid "+move.toHex();
          master_guess_count += 1;
          //TODO calculate mdata_by_move since a new answer by a guesser does not refresh
          if(mdata_by_move.hasOwnProperty(move)){ //move already logged before
            if ((mdata_by_move[move].length < TOOLTIP_LIMIT) && !(mdata_by_move[move].includes(author))){
              mdata_by_move[move].push(author);
            }
          }else{ //first time move is logged
            mdata_by_move[move] = [author];
          }
        }
        //else chat message is not a chess move
        else{
          if(!show_non_move){
            this.style.display = 'none';
          }

        }
      }
    });
  });

  ytDiv = parent.document.querySelector(ytInner);
  let chartDiv = document.createElement("div");
  chartDiv.setAttribute('id','chartDiv');
  chartDiv.style["min-height"] = "596px"; //same as livechat box
  let canv = document.createElement("canvas");
  canv.setAttribute('id','chartCanvas');
  chartDiv.prepend(canv);
  ytDiv.prepend(chartDiv);

  //tooltip handler for chart
  const externalTooltipHandler = (context) => {
    // Tooltip Element
    const {chart, tooltip} = context;
    const tooltipEl = getOrCreateTooltip(chart);

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Set Text
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map(b => b.lines);
      const tableHead = document.createElement('thead');
      titleLines.forEach(title => {
        const tr = document.createElement('tr');
        tr.style.borderWidth = 0;
        const th = document.createElement('th');
        th.style.borderWidth = 0;
        const text = document.createTextNode(title);
        th.appendChild(text);
        tr.appendChild(th);
        tableHead.appendChild(tr);
      });
      const tableBody = document.createElement('tbody');
      bodyLines.forEach((body, i) => {
        const colors = tooltip.labelColors[i];
        const span = document.createElement('span');
        span.style.background = colors.backgroundColor;
        span.style.borderColor = colors.borderColor;
        span.style.borderWidth = '2px';
        span.style.marginRight = '10px';
        span.style.height = '10px';
        span.style.width = '10px';
        span.style.display = 'inline-block';
        const tr = document.createElement('tr');
        tr.style.backgroundColor = 'inherit';
        tr.style.borderWidth = 0;
        const td = document.createElement('td');
        td.style.borderWidth = 0;
        const text = document.createTextNode(body);
        td.appendChild(span);
        td.appendChild(text);
        tr.appendChild(td);
        tableBody.appendChild(tr);
        //append top_guessers
        _.each(mdata_by_move[titleLines[0]], function(author){
            var guesser_span = document.createElement('span');
            var guesser_tr = document.createElement('tr');
            guesser_tr.style.backgroundColor = 'inherit';
            guesser_tr.style.borderWidth = 0;
            var guesser_td = document.createElement('td');
            guesser_td.style.borderWidth = 0;
            var guesser_text = document.createTextNode(author);
            guesser_td.appendChild(guesser_span);
            guesser_td.appendChild(guesser_text);
            guesser_tr.appendChild(guesser_td);
            tableBody.appendChild(guesser_tr);
          }
        );
      });
      const tableRoot = tooltipEl.querySelector('table');
      // Remove old children
      while (tableRoot.firstChild) {
        tableRoot.firstChild.remove();
      }
      // Add new children
      tableRoot.appendChild(tableHead);
      tableRoot.appendChild(tableBody);
    }
    const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;
    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.padding + 'px ' + tooltip.padding + 'px';
  };

  //Chart config
  var config = {
    type: 'bar',
    data:
        {
            datasets: [{
              //maxBarThickness: 50,
              data: []
            }],
            labels: []
        },
    plugins: [ChartDataLabels],
    options:
        {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,

          animation: {
            duration: 0
          },

          scales: {
            x: {
              grace: '5%',
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            },
            y: {
              ticks: {
                font: {
                  size: 20
                }
              }
            }
          },

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              enabled: false,
              position: 'nearest',
              external: externalTooltipHandler
            }
          }
        }
  };

  var ctx = canv.getContext('2d');
  var chart = new Chart(ctx, config);


  //CLEAR BUTTON LOGIC
  clearBtn.addEventListener("click", function() {
    move_data = {};
    mdata_by_move = {};
    chart.data = mov_dat;
    chart.update();
  });

  //SHOW/HIDE NON-CHESS MOVES BUTTON LOGIC
  let chessBtn = document.createElement("button");
  chessBtn.setAttribute('id','chessBtn');
  chessBtn.textContent = 'Show only moves';
  btnDiv = document.querySelector("#startDiv");
  btnDiv.append(chessBtn);
  chessBtn.addEventListener("click", function() {
    if (show_non_move){
      chessBtn.textContent = 'Show all chats';
      show_non_move=false;
    }else{
      chessBtn.textContent = 'Show only moves';
      show_non_move=true;
    }
    
  });

  //RUNS EVERY 1s
  setInterval(function(){
    // console.log('print move data every 1s..');
    var dat = [];
    var labels = [];
    var colors = [];
    
    // console.log(move_data);
    // console.log(_.size(_.allKeys(move_data)));
    m_data_tmp = _.each(move_data, function(v, k, o) { return v });
    //Limits to top 10 answers
    counts = _.countBy(m_data_tmp,'move');
    //console.log(counts);
    //build object in format [{'move': 'bb4', 'count': 2}, ..]
    move_counts = []
    _.each(counts, function(v, k, o) {
      move_counts.push({move: k, count: v});
    });
    //console.log(move_counts);
    sorted_counts = _.sortBy(move_counts, function(o){return o.count}).reverse();
    //console.log(sorted_counts);
    counter = 0;
    _.each(sorted_counts, function(o) {
      if(counter < 10){
        dat.push(o.count);
        labels.push(o.move);
        colors.push(o.move.toHex());
      };
      counter++;
    });
    mov_dat =
      {
        labels: labels,
        datasets:
        [
          {
            datalabels: {
              color: '#414548',
              anchor: 'end',
              align: 'right',
              offset: '5',
              font: {
                weight: 'bold'
              },
            },            
            maxBarThickness: 50,
            data: dat,
            backgroundColor: colors
          }
        ]
      };
    
    // console.log('mov_dat', mov_dat);
    chart.data = mov_dat;
    chart.update();
  }, 1000);
};


elementReady(ytChatInner).then((element)=>{
  let btnDiv = document.createElement("div");
  btnDiv.setAttribute('id','startDiv');

  let startBtn = document.createElement("button");
  startBtn.setAttribute('id','startBtn');
  startBtn.textContent = 'START';
  btnDiv.prepend(startBtn);

  // let stopBtn = document.createElement("button");
  // stopBtn.setAttribute('id','stopBtn');
  // stopBtn.textContent = 'STOP';
  // div.append(stopBtn);

  let clearBtn = document.createElement("button");
  clearBtn.setAttribute('id','clearBtn');
  clearBtn.textContent = 'CLEAR';
  btnDiv.append(clearBtn);

  element.prepend(btnDiv);

  startBtn.addEventListener("click", startApp,);
});

//Chart helpers
const getOrCreateTooltip = (chart) => {
  let tooltipEl = chart.canvas.parentNode.querySelector('div');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
    tooltipEl.style.borderRadius = '3px';
    tooltipEl.style.color = 'white';
    tooltipEl.style.opacity = 1;
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transform = 'translate(-50%, 0)';
    tooltipEl.style.transition = 'all .1s ease';
    tooltipEl.style['font-size'] = '14px';

    const table = document.createElement('table');
    table.style.margin = '0px';

    tooltipEl.appendChild(table);
    chart.canvas.parentNode.appendChild(tooltipEl);
  }

  return tooltipEl;
};

