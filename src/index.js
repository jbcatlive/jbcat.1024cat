import React from 'react';
import ReactDOM from 'react-dom';
import { useMediaQuery } from 'react-responsive'
import Hotkeys from 'react-hot-keys';
import ReactTouchEvents from 'react-touch-events';
import 'prevent-pull-refresh';

function Cell(props) {
  const divStyle = {
    position: 'relative',
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
  };

  const hStyle = {
    position: 'absolute',
    top: '30%',
    left: '20%',
  };

  return (
    <div style={divStyle} >
      {props.cellNum != null && props.cellNum <= 2048 &&
        <img rel="preload" src={process.env.PUBLIC_URL + '/img/' + props.cellNum + '.jpg'} alt='{props.cellNum}' style={imgStyle} />
      }
      {props.cellNum != null && props.cellNum > 2048 &&
        <img rel="preload" src={process.env.PUBLIC_URL + '/img/' + 'infinity' + '.jpg'} alt='{props.cellNum}' style={imgStyle} />
      }
      {props.cellNum != null && props.cellNum <= 2048 &&
        <div className='h1' style={hStyle} >{props.cellNum}</div>
      }
      {props.cellNum != null && props.cellNum > 2048 &&
        <div className='h2' style={hStyle} >{props.cellNum}</div>
      }
    </div>
  )
}

function Row(props) {
  const divStyle = {
    width: useResponsiveValues()['cellWidth'],
    height: useResponsiveValues()['cellWidth'],
  };

  return (
    <div className='d-table'>
      {
        [...props.cellNumsRow.keys()].map(cellNumKey => {
          return (
            <div className="d-table-cell border v-align-middle" style={divStyle} key={cellNumKey}>
              <Cell cellNum={props.cellNumsRow[cellNumKey]}/>
            </div>
          )
        })
      }
    </div>
  )
}

function Board(props) {
  return(
    <div>
      {
        [...defaultValues()['rowIndexRanges'].keys()].map(rowIndexRangeKey => {
          return (
            <div className="d-flex flex-justify-center" key={rowIndexRangeKey}>
              <Row 
                cellNumsRow={props.cellNums.slice(
                  defaultValues()['rowIndexRanges'][rowIndexRangeKey][0],
                  defaultValues()['rowIndexRanges'][rowIndexRangeKey][1])}
              />
            </div>
          )
        })
      }
    </div>
  )
}

function BackBtn(props) {
  const divStyle = {
    width: useResponsiveValues()['cellWidth'],
  };
  return (
    <div className="btn btn-block mt-6 mb-6 mx-auto pb-2" type="button" style={divStyle} onClick={props.onClick}>
      back({props.restBackTimes})
    </div>
  )
}

function RestartBtn(props) {
  const divStyle = {
    width: useResponsiveValues()['cellWidth'],
  };
  return (
    <div className="btn btn-block mt-6 mb-6 mx-auto pb-2" type="button" style={divStyle} onClick={props.onClick}>
      restart
    </div>
  )
}

class Game extends React.Component {
  constructor(props) {
    super(props);

    var img = new Image();
    img.src = process.env.PUBLIC_URL + '/img/' + 2 + '.jpg'
    img.src = process.env.PUBLIC_URL + '/img/' + 4 + '.jpg'

    const nRows = defaultValues()['nRows'];
    let cellNums = Array(nRows * nRows).fill(null);
    for (let i = 1; i <= 2; i++) {
      let randomIndex = getRandomIndexOfNullValues(cellNums)
      cellNums[randomIndex] = getProb2Or4(0.9);
    }
    let score = 0;

    this.state = {
      restBackTimes: 0,
      history: [{
        cellNums: cellNums,
        score: score,
      }],
    };

    this.restart = this.restart.bind(this);
    this.move = this.move.bind(this);
    this.back = this.back.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.handleSwipe = this.handleSwipe.bind(this);
  }

  move(key) {
    let history = this.state.history;
    let current = history[history.length - 1];
    let cellNums = current.cellNums.slice();
    let score = current.score;
    let nRows = defaultValues()['nRows'];
    let maxBackTimes = defaultValues()['maxBackTimes'];
    let indexsAll = [...Array(nRows * nRows).keys()];
    let changeTimes = 0;
    for (let i of [...Array(nRows).keys()]) {
      let indexs = indexsAll.filter(index => (
        ['ArrowUp', 'ArrowDown'].includes(key) ? (index % nRows === i) : ((index / nRows >= i) && (index / nRows < i + 1))
      ))
      indexs = ['ArrowUp', 'ArrowLeft'].includes(key) ? indexs : indexs.reverse();
      let indexsNotNull = getIndexsOfNotNullValues(cellNums).filter(index => (
        ['ArrowUp', 'ArrowDown'].includes(key) ? (index % nRows === i) : ((index / nRows >= i) && (index / nRows < i + 1))
      ))
      indexsNotNull = ['ArrowUp', 'ArrowLeft'].includes(key) ? indexsNotNull : indexsNotNull.reverse();
      mergeSameNumberCell(indexsNotNull);
      indexsNotNull = getIndexsOfNotNullValues(cellNums).filter(index => (
        ['ArrowUp', 'ArrowDown'].includes(key) ? (index % nRows === i) : ((index / nRows >= i) && (index / nRows < i + 1))
      ))
      indexsNotNull = ['ArrowUp', 'ArrowLeft'].includes(key) ? indexsNotNull : indexsNotNull.reverse();
      compressNullCell(indexsNotNull, indexs);
    }
    if (changeTimes > 0) {
      let randomIndex = getRandomIndexOfNullValues(cellNums);
      cellNums[randomIndex] = getProb2Or4(0.9);
      score ++;
      if (history.length > maxBackTimes) {
        history.shift();
      }
      history.push({
        cellNums: cellNums,
        score: score,
      })
    }

    this.setState({
      history: history,
      restBackTimes: history.length - 1,
    });

    function mergeSameNumberCell(indexsNotNull) {
      if (indexsNotNull.length >= 2) {
        for (let i = 0; i < (indexsNotNull.length - 1); i++) {
          if (cellNums[indexsNotNull[i]] === cellNums[indexsNotNull[i+1]]) {
            changeTimes ++;
            console.log(indexsNotNull[i], indexsNotNull[i+1])
            cellNums[indexsNotNull[i]] = cellNums[indexsNotNull[i]] + cellNums[indexsNotNull[i+1]];
            cellNums[indexsNotNull[i+1]] = null;
            i++;
          }
        }
      }
    }

    function compressNullCell (indexsNotNull, indexs) {
      let len = indexs.length;
      let lenNotNull = indexsNotNull.length;
      if (lenNotNull >= 1) {
        if (indexs.indexOf(indexsNotNull[indexsNotNull.length - 1]) > (lenNotNull - 1)) {
          changeTimes ++;
          for (let i = 0; i < lenNotNull; i++) {
            cellNums[indexs[i]] = cellNums[indexsNotNull[i]];
          }
          if(lenNotNull < len) {
            for (let i = lenNotNull; i < len; i++) {
              cellNums[indexs[i]] = null;
            }
          }
        }
      }
    }
  }

  back() {
    if (this.state.restBackTimes < 1) {
      return;
    }
    const history = this.state.history.slice(0, this.state.history.length - 1);
    this.setState({
      history: history,
      restBackTimes: history.length - 1,
    });
  }

  restart() {
    const nRows = defaultValues()['nRows'];
    let cellNums = Array(nRows * nRows).fill(null);
    for (let i = 1; i <= 2; i++) {
      let randomIndex = getRandomIndexOfNullValues(cellNums)
      cellNums[randomIndex] = getProb2Or4(0.9);
    }
    let score = 0;
    this.setState({
      history: [{
        cellNums: cellNums,
        score: score,
      }],
      restBackTimes: 0,
    })
  }

  onKeyDown(keyName, e, handle) {
    if (e.key === ' ') {
      this.back()
    } else if (e.key === 'Escape') {
      this.restart()
    } else {
      this.move(e.key)
    }
  }

  handleSwipe(direction) {
    const directionToKeyMap = {
      'top': 'ArrowUp',
      'bottom': 'ArrowDown',
      'left': 'ArrowLeft',
      'right': 'ArrowRight',
    }
    this.move(directionToKeyMap[direction])
  }

  render() {
    const history = this.state.history;
    const current = history[history.length - 1];

    return (
      <div>
        <ReactTouchEvents
          onSwipe={this.handleSwipe}
        >
          <div className="container-sm mt-6 mb-3 pb-6">
            <div className='h1 text-center mb-6'>
              score: {current.score}
            </div>
            <BackBtn onClick={this.back} restBackTimes={this.state.restBackTimes}/>
            <Board
              cellNums={current.cellNums}
            />
            <RestartBtn onClick={this.restart}/>
          </div>
        </ReactTouchEvents>
        <Hotkeys
          keyName="*"
          filter={(e) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(e.key)}
          onKeyDown={this.onKeyDown}
        />
      </div>
    );
  }
}

function MicromessengerWarning() {
  return (
    <div>
      <div>Wechat browser is not supported currently, please open with other browsers</div>
      <div>微信浏览器暂不支持, 请使用其他浏览器打开</div>
    </div>
  )
}

ReactDOM.render(
  (
  window.navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1
  ? <MicromessengerWarning />
  : <Game />
  ),

  document.getElementById('root')
);

// ---------------------------------------------------

function useResponsiveValues() {
  const isWidthMoreThan1025 = useMediaQuery({ query: '(min-width: 1025px)' });
  const isWidthMoreThan370 = useMediaQuery({ query: '(min-width: 370px)' });

  const cellWidth = isWidthMoreThan1025 ? '150px' : (isWidthMoreThan370 ? '90px' : '68px');

  return {
    cellWidth: cellWidth,
  };
}

function defaultValues() {
  const nRows = 4;
  const rowIndexRanges = [...Array(nRows).keys()].map(x => [x*nRows, (x+1)*nRows]);
  const maxBackTimes = 5;

  return {
    nRows: nRows,
    rowIndexRanges: rowIndexRanges,
    maxBackTimes: maxBackTimes,
  };
}

// ---------------------------------------------------

// global functions
function getIndexsOfNullValues (arrayLike) {
  return arrayLike.reduce(
    (pre, currValue, currIndex) => (currValue === null) ? pre.concat(currIndex) : pre, []
  )
}

function getIndexsOfNotNullValues (arrayLike) {
  return arrayLike.reduce(
    (pre, currValue, currIndex) => (currValue != null) ? pre.concat(currIndex) : pre, []
  )
}

function getRandom() {
  return Math.random();
}

function getRandomElement (arrayLike) {
  let maxIndex = arrayLike.length - 1;
  return arrayLike[Math.floor(getRandom() * (maxIndex + 1))];
}

function getRandomIndexOfNullValues (arrayLike) {
  return getRandomElement(getIndexsOfNullValues(arrayLike))
}

function getProb2Or4 (prob) {
  return getRandom > prob ? 4 : 2
}
