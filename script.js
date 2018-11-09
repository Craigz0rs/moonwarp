/////Global Variables/////-----------------------------------------------------------------------
const c = 299792 //km/s in vacuum
const kmInPx = 3474.2 //1px = 3474.2km (mean diameter of moon)
let maxScroll = $('#scrollEnd').position() //max renderable scroll position in px
let currentScrollPosition = document.documentElement.scrollLeft || document.body.scrollLeft
let units = 'km' //curent unit of measurement

//static trip data
let tripOrigin = '#sun' //trip origin id
let tripDestination = '#scrollEnd' //current trip destination id
let warpFactorInput = 0
let tripDurationInMs = 0 //current trip duration
let tripDistanceInPx = 0 //current trip distance between origin and destination in px
let isAtWarp = false
let liveTripData
let tripEnd

/////Objects/////--------------------------------------------------------------------------------
//unit ratios, base unit is 1km
const distanceRatio = {
  px: 1 / 3474.2,
  km: 1,
  mi: 1.60934,
  au: 1 / 149597870.7,
  ly: 1 / 9460730472580.8,
  lsec: 1 / 299792,
  lmin: 1 / 17987520
}

let tripData = {
  originID: '',
  originLeftPosPx: 0,
  lastLocationID: '',
  lastLocationPosPx: 0,
  destinationID: '#scrollEnd',
  destinationLeftPosPx: 0,
  tripDistancePx: 0,
  distanceTravelledPx: 0,
  tripDurationMs: 0,
  tripElapsedMs: 0,
  tripRemainingMs: 0,
  isTripSet: false,
  tripStatus: ''
}

const defaultTrip = {
  originID: '',
  originLeftPosPx: 0,
  lastLocationID: '',
  lastLocationPosPx: 0,
  destinationID: '#scrollEnd',
  destinationLeftPosPx: 0,
  tripDistancePx: 0,
  distanceTravelledPx: 0,
  tripDurationMs: 0,
  tripRemainingMs: 0,
  tripElapsedMs: 0,
  isTripSet: false,
  tripStatus: ''
}

//probe objects used for calculating actual current distance from the sun
const probes = [
  {
    name: 'voyager1',
    speed: 17,
    referenceDate: new Date(2018, 6, 8, 17, 26, 00, 00),
    referenceDistance: 21330068000
  }, {
    name: 'voyager2',
    speed: 15.4,
    referenceDate: new Date(2018, 6, 8, 17, 28, 00, 00),
    referenceDistance: 17649401340
  }, {
    name: 'new-horizons',
    speed: 14.1,
    referenceDate: new Date(2018, 6, 8, 14, 50, 00, 00),
    referenceDistance: 6260518000
  }, {
    name: 'pioneer10',
    speed: 11.9,
    referenceDate: new Date(2018, 8, 26, 22, 53, 00, 00),
    referenceDistance: 18230009300
  }, {
    name: 'pioneer11',
    speed: 11.3,
    referenceDate: new Date(2018, 8, 26, 22, 54, 00, 00),
    referenceDistance: 14840177100
  }
]

//strship objects
const starships = [
  {
    objectId: 'nx01',
    name: 'USS Enterprise',
    registration: 'NX-01',
    class: 'NX',
    maxWarp: 5.2,
    maxWarpDuration: 0,
    maxCruise: 0,
    active: '22nd Century',
    length: 225,
    beam: 135.8,
    height: 33.3,
    mass: 80000,
    decks: 7,
    crew: 83
  }, {
    objectId: 'entA',
    name: 'USS Enterprise',
    registration: 'NCC-1701',
    class: 'Constitution',
    maxWarp: 8,
    maxWarpDuration: 0,
    maxCruise: 0,
    active: '23rd Century',
    length: 289,
    beam: 127.1,
    height: 72.6,
    mass: 600000,
    decks: 21,
    crew: 205
  }, {
    objectId: 'entD',
    name: 'USS Enterprise',
    registration: 'NCC-1701-D',
    class: 'Galaxy',
    maxWarp: 9.8,
    maxWarpDuration: 0,
    maxCruise: 0,
    active: '24th Century',
    length: 641,
    beam: 470,
    height: 145,
    mass: 4960000,
    decks: 42,
    crew: 1013
  }, {
    objectId: 'entE',
    name: 'USS Enterprise',
    registration: 'NCC-1701-E',
    class: 'Soveriegn',
    maxWarp: 9.85,
    maxWarpDuration: 0,
    maxCruise: 0,
    active: '24th Century',
    length: 680,
    beam: 240,
    height: 87,
    mass: 3500000,
    decks: 24,
    crew: 700
  }, {
    objectId: 'defiant',
    name: 'USS Defiant',
    registration: 'NX-74205',
    class: 'Defiant',
    maxWarp: 9.5,
    maxWarpDuration: 0,
    maxCruise: 0,
    active: '24th Century',
    length: 170.68,
    beam: 134.11,
    height: 30.1,
    mass: 355000,
    decks: 4,
    crew: 50
  }, {
    objectId: 'voyager',
    name: 'USS Voyager',
    registration: 'NCC-74656',
    class: 'Intrepid',
    maxWarp: 9.975,
    maxWarpDuration: 0,
    maxCruise: 0,
    active: '24th Century',
    length: 344,
    beam: 133,
    height: 66,
    mass: 700000,
    decks: 15,
    crew: 141
  }
]

//////Event Handlers/////------------------------------------------------------------------------
//updates currentScrollPosition on scroll
window.onscroll = () => {
  currentScrollPosition = document.documentElement.scrollLeft || document.body.scrollLeft
  liveScrollPos()
  if (tripData.isTripSet && !isAtWarp && tripData.tripStatus !== 'paused') {
    document.querySelector('#origin').options.selectedIndex = 0
  }
}

window.onload = () => {
  liveScrollPos()
  displayUnits()
  document.querySelector('#warpInput').value = 0
  document.querySelector('#destination').options.selectedIndex = 0
  document.querySelector('#origin').options.selectedIndex = 0
  // tripData()
  // liveScrollSpeed()
}

//Navigation menu event listener
document.querySelector('.navigation').addEventListener("click", function() {
  let theTarget = event.target
  if (theTarget.getAttribute('href') !== null) {
    theTarget = theTarget.getAttribute('href')
    warpScroll(1500, theTarget, "easeInOutExpo");
    setTimeout(originUpdate, 1501)
    function originUpdate() {
      calculateScrollDuration()
    }
  }
})

document.querySelector('#origin').addEventListener("click", function(){
  event.target.onchange = () => {
      tripData.lastLocationID = tripData.originID
      tripData.lastLocationPosPx = currentScrollPosition
      tripData.originID = event.target.value
      tripData.originLeftPosPx = elementPositionXInPx(tripData.originID)
      console.log(`origin: ${tripData.originID}`)
      warpScroll(1000, tripData.originID, "easeInOutExpo")
      setTimeout(originUpdate, 1001)
      function originUpdate() {
        if (tripData.isTripSet) {
          calculateStaticTripData()
        }
      }
  }
})

document.querySelector('#destination').addEventListener("click", function(e){
  e.target.onchange = () => {
      let destinationID = event.target.value
      let destinationOption = event.target.options.selectedIndex
      let status = tripData.tripStatus
      //tripDestination = event.target.value
      if (tripData.tripStatus === 'paused') {
        console.log(`Prompt for reset or resume trip`)
     } else if (status === 'complete') {
        resetTripData()
        document.querySelector('#destination').options.selectedIndex = destinationOption
        tripData.destinationID = destinationID
        tripData.destinationLeftPosPx = parseFloat(elementPositionXInPx(tripData.destinationID))
        tripData.isTripSet = true
        calculateStaticTripData()
      } else {
        tripData.destinationID = event.target.value
        tripData.destinationLeftPosPx = parseFloat(elementPositionXInPx(tripData.destinationID))
        tripData.isTripSet = true
        calculateStaticTripData()
      }
      console.log(`destination: ${tripData.destinationID}`)
      calculateScrollDuration()
  }
})

document.querySelector('#warpInput').addEventListener('change', function(){
  warpFactorInput = parseFloat(event.target.value)
  if (warpFactorInput > 10 || isNaN(warpFactorInput) || warpFactorInput < 0) {
    console.log(`Warpfactor must be 0-10`)
    document.getElementById('warpInput').value = warpFactorInput
  } else {
    if (tripData.isTripSet) {
      calculateStaticTripData()
    }
  } 

})

document.querySelector('#engage').addEventListener('click', function(){
  tripDurationInMs = calculateScrollDuration()
  if (tripDurationInMs !== 0 && tripDurationInMs != Infinity) {
    if (tripData.isTripSet) {
      if (isAtWarp) {

      } else if (!isAtWarp && tripData.tripStatus === 'paused') {
        console.log(`Prompt user to resume from previous or current locations`)
      }
      
      tripData.originLeftPosPx = currentScrollPosition
      tripData.tripStatus = 'ip'
      liveTripData = setInterval(calculateLiveTripData, 50)
      tripEnd = setTimeout(setTripEnd, tripDurationInMs + 100)
    }
    warpScroll(tripDurationInMs, tripData.destinationID, "linear")
    isAtWarp = true
    console.log(`trip duration: ${tripDurationInMs}`)
  } else {
    console.log(`warp factor is 0, cannot go anywhere at 0.`)
    console.log(`trip duration: ${tripDurationInMs}`)
    event.preventDefault()
  }
})

document.querySelector('#stop').addEventListener('click', function(){
  warpScroll(0, "#stop-point", 'linear')
  isAtWarp = false
  if (tripData.isTripSet) {
    clearInterval(liveTripData)
    clearTimeout(tripEnd)
    tripData.tripStatus = 'paused'
  }
  event.preventDefault()
})

document.querySelector('#reset').addEventListener('click', function(){
  warpScroll(0, "#stop-point", 'linear')
  isAtWarp = false
  if (tripData.isTripSet) {
    clearInterval(liveTripData)
    clearTimeout(tripEnd)
  }
  resetTripData()
  event.preventDefault()
})

document.querySelector('#unitSelect').addEventListener('change', function(){
  units = event.target.value
  displayUnits()
  liveScrollPos()
  printStaticTripData(false)
  printLiveTripData(false)
})

/////Functions/////------------------------------------------------------------------------------
//Live data functions//---------
/**
 * Prints the current scroll postion relative to #sun formatted to selected units to the DOM.
 * @function liveScrollPos
 * @global
 * @return {String} A rounded floating-point number converted to a String with local number formatting.
 */
const liveScrollPos = () => document.querySelector('#liveDistance').innerHTML = convertUnits(calculateDifference(currentScrollPosition, elementPositionXInPx('#sun')), 'px', units, true).toLocaleString()

/**
 * Calculates and returns the current actual probe distance from the Sun in km.
 * 
 * Calculation is done by calculating how far the probe has travelled since the reference date and adding it to the reference distance.
 * @function currentProbeLocation
 * @global
 * @param probeSpeed          {Number}  Probe's actual speed in km/s.
 * @param probeRefDistance    {Number}  Probe's distance from the Sun on the date the object was originally created.
 * @param probeRefDate        {Date}    Date object of when the probe object was originally created. 
 * @return {Number} Current distance from the Sun in km.
 */
const currentProbeLocation = (probeSpeed, probeRefDistance, probeRefDate) => (probeRefDistance + probeSpeed * ((new Date() - probeRefDate) / 1000))

/**
 * Updates probe positions and prints to live position counter in DOM every 100ms.
 * @function updateProbes
 * @global
 */
const updateProbes = setInterval(() => {
  for (let probe of probes) {
    let distanceInPx = convertUnits(currentProbeLocation(probe.speed, probe.referenceDistance, probe.referenceDate), 'km', 'px', false )
    document.querySelector(`#${probe.name}`).style.left = `${(distanceInPx)}px`
    document.querySelector(`#${probe.name}Distance`).innerHTML = convertUnits(distanceInPx, 'px', units, true).toLocaleString()
  }
}, 100)

//Data conversion, formatting, and calculations//---------
/**
 * Universal unit converter.
 * 
 * Converts between distance units and optionally rounds them for DOM display. Utilizes the ratios in the distanceRatio object.
 * @function convertUnits
 * @global
 * @param {Number}  inputData   Floating-point number input for conversion.
 * @param {String}  inputUnit   A String corresponding to a unit key in the distanceRatio object, matching the inputData unit.
 * @param {String}  outputUnit  A String corresponding to a unit key in the distanceRatio object, to convert inputData to.
 * @param {Boolean} isRounded   True to round return number based on the outputUnit key, False to skip rounding and return unrounded value.
 * @return {Number} The converted floating-point number based on the desired unit.
 */
const convertUnits = (inputData, inputUnit, outputUnit, isRounded) => {
  let output
  if (outputUnit !== 'lsec' || outputUnit !== 'lmin') {
    output = (distanceRatio[outputUnit] * inputData) / distanceRatio[inputUnit]
  } else {
    inputData = (distanceRatio.km * inputData) / distanceRatio[inputUnit]
    output = (distanceRatio[outputUnit] * inputData) / distanceRatio[inputUnit]
  }
  if (isRounded) {
    switch (outputUnit) {
      case 'km': case 'mi': case 'px':
        output = roundValue(output, 0)
        break
      case 'au':
        output = roundValue(output, 4)
        break
      case 'lmin': case 'lsec':
        output = roundValue(output, 1)
        break;
    }
  }
  return output
}

/**
 * Changes the displayed units in the DOM to the newly selected unit.
 * @function displayUnits
 * @global
 */
const displayUnits = () => {
  let infoUnitNodes = document.querySelectorAll('.warpInfoUnits')
  for (let node of infoUnitNodes) {
    node.innerHTML = ` ${units}`
  }
}

/**
 * Rounds numbers to a given number of decimal places.
 * @function roundValue
 * @global
 * @param  {Number} inputValue        Number to be rounded.
 * @param  {Number} numberOfDecimals  Number of decimal places for the resulting number.
 * @return {Number} A floating-point number rounded to the number of decimals indicated.
 */
const roundValue = (inputValue, numberOfDecimals) => parseFloat(inputValue.toFixed(numberOfDecimals))

/**
 * Determines left scroll position of HTML element via ID tag.
 * @function elementPositionXInPx
 * @global
 * @param {String} elementId String must include #.
 * @return {float} Left scroll position in px.
 */
const elementPositionXInPx = (elementId) => document.querySelector(elementId).offsetLeft

/**
 * Calculates the difference between two values and returns a positive result.
 * @function calculateDifference
 * @global
 * @param {Number} value1      Origin left scroll position in px.
 * @param {Number} value2      Destination left scroll position in px.
 * @return {Number} Difference adjusted to positive value.
 */
const calculateDifference = (value1, value2) => {
  let difference = value1 - value2
  if (Math.sign(difference) === -1) {
    difference = -(difference)
  }
  return difference
}

/**
 * Calculates the distance between tripDestination and currentScrollPosition.
 * 
 * Uses global variables tripDestination {String} and currentScrollPosition {Number} to calculate.
 * @function calculateScrollDistance
 * @global
 * @return {Number} Difference adjusted to positive value.
 */
const calculateScrollDistance = () => calculateDifference(elementPositionXInPx(tripData.destinationID), currentScrollPosition)

/**
 * Calculates scroll duration for a trip in px/s.
 * 
 * Uses global variables tripDestination {String} and currentScrollPosition {Number} and warpFactorInput to calculate.
 * @function calculateScrollDuration
 * @global
 * @return {Number} Scroll duration in px/s adjusted to positive value.
 */
const calculateScrollDuration = () => {
  let scrollDuration = ((calculateDifference(elementPositionXInPx(tripData.destinationID), currentScrollPosition)) / convertUnits((warpSpeed(warpFactorInput)), 'km', 'px', false) * 1000)
  if (Math.sign(scrollDuration) === -1) {
    scrollDuration = -(scrollDuration)
  }
  // console.log(`scroll duration: ${scrollDuration}`)
  return scrollDuration
}

/**
 * Calculates warp speed as multiple of c in km/s.
 * 
 * Converts the warp factor into a multiple of the speed of light
 * @function warpSpeed
 * @global
 * @param warpFactor  {Number}  User input warp factor 0-10.
 * @return {Number} Speed in km/s as a multiple of the speed of light.
 */
const warpSpeed = (warpFactor) => {
  //equation calculates multiple of c for warp factors >= 1 && <= 9
  const warpEquation = (factor) => Math.pow(factor, (10 / 3))
  let lightMultiple = undefined

  if (warpFactor >= 10) {
    lightMultiple = 9007199254740991
  } else if (warpFactor < 1) {
    lightMultiple = warpFactor
  } else if (warpFactor <= 9) {
    lightMultiple = warpEquation(warpFactor)
  } else if (warpFactor > 9 && warpFactor <= 9.9) {
    let rounded = Math.round(warpFactor * 10) / 10
    switch (rounded) {
      case 9.1:
        lightMultiple = 1582
        break
      case 9.2:
        lightMultiple = 1649
        break
      case 9.3:
        lightMultiple = 1711
        break
      case 9.4:
        lightMultiple = 1776
        break
      case 9.5:
        lightMultiple = 1841
        break
      case 9.6:
        lightMultiple = 1909
        break
      case 9.7:
        lightMultiple = 2106
        break
      case 9.8:
        lightMultiple = 2462
        break
      case 9.9:
        lightMultiple = 3053
        break;
    }
  } else if (warpFactor > 9.9 && warpFactor <= 9.975) {
    lightMultiple = 4364
  } else if (warpFactor > 9.975) {
    lightMultiple = 5829
  }
  console.log(`light multiple: ${lightMultiple}`)
  return lightMultiple * c
}

/**
 * Initiates smooth scroll animation.
 * @function warpScroll
 * @global
 * @param scrollDuration  {Number}  Time in ms the scroll will take to execute.
 * @param anchor          {String}  The anchor tag of the end point of the scroll in format: #tag.
 * @param easeType        {String}  JQuery UI ease type animation - warp uses a linear ease, navigation uses easeInOutExpo.
 */
let warpScroll = (scrollDuration, anchor, easeType) => {
  $('html, body').stop().animate({
    scrollLeft: $(anchor).offset().left
  }, scrollDuration, easeType);
  event.preventDefault();
}

////Trip Functions////
/**
 * Resets tripData object and #origin and #destionation inputs on the DOM.
 * @function resetTripData
 * @global
 */
const resetTripData = () => {
  document.querySelector('#origin').options.selectedIndex = 0
  document.querySelector('#destination').options.selectedIndex = 0
  tripData = Object.assign({}, defaultTrip)
  printStaticTripData(true)
  clearInterval(liveTripData)
  clearTimeout(tripEnd)
  printLiveTripData(true)
}

/**
 * Calculates trip data for DOM display
 * @function resetTripData
 * @global
 */
const calculateStaticTripData = () => {
  tripData.tripDistancePx = calculateScrollDistance()
  console.log(`trip distance: ${tripData.tripDistancePx}`)
  tripData.tripDurationMs = calculateScrollDuration()
  console.log(`trip duration: ${tripData.tripDurationMs}`)
  printStaticTripData(false)
}

/**
 * Prints the formatted static trip data to the DOM.
 * 
 * Static trip data include the trip distance and trip duration
 * @function printStaticTripData
 * @global
 * @param isReset {Boolean} If called by a reset event it will print blank strings to the DOM.
 */
const printStaticTripData = (isReset) => {
  let tripDuration = tripData.tripDurationMs
  let tripDistance = convertUnits(tripData.tripDistancePx, 'px', units, true).toLocaleString()
  if(isReset) {
    tripDuration = ''
    tripDistance = ''
  } else {
    if (tripDuration === Infinity) {
      tripDuration = '&#x221e;'
    } else if (tripDuration < 1) {
      tripDuration = 'Instantaneous'
    } else if (typeof tripDuration === "number") {
      tripDuration = document.querySelector('#tripDuration').innerHTML = formatTime(tripData.tripDurationMs).toLocaleString()
    }
  }
  document.querySelector('#warpInfoDistance').innerHTML = tripDistance
  document.querySelector('#tripDuration').innerHTML = tripDuration
  
}

/**
 * Calls calculate functions for live distance and time and the print function for live trip data.
 * 
 * Static trip data include the trip distance and trip duration
 * @function calculateLiveTripData
 * @global
 */
const calculateLiveTripData = () => {
  calculateLiveTripDistance()
  calculateLiveTripTimer()
  calculateLiveTripSpeed()
  printLiveTripData(false)
}

const calculateLiveTripSpeed = () => {

}

/**
 * Calculates live trip distance and assigns it to distanceTravelledPx in the tripData object.
 * 
 * Static trip data include the trip distance and trip duration
 * @function calculateLiveTripDistance
 * @global
 */
const calculateLiveTripDistance = () => tripData.distanceTravelledPx = calculateDifference(tripData.originLeftPosPx, currentScrollPosition)


const calculateLiveTripTimer = () => {
  tripData.tripElapsedMs += 50
  tripData.tripRemainingMs -= 50
}

/**
 * Converts MS to a readable time format.
 * 
 * Static trip data include the trip distance and trip duration
 * @function formatTime
 * @global
 * @param timeInMs {Number} The input time in MS for formatting.
 * @return {String} Formatted time.
 */
const formatTime = (timeInMs) => {
  // console.log('time in ms: ' + timeInMs)
  let output = 0
  let timeBlocks = [0,0,0,0,0,0]
  let timeBlockUnits = [ ' yr', ' wk', ' days', ' hr', ' min',' sec']
  if (timeInMs !== NaN && timeInMs >= 1 && timeInMs !== Infinity) {
    output = ''
    // timeBlocks[6] = Math.floor(timeInMs) %1000
    timeBlocks[5] = roundValue((timeInMs / 1000) %60, 1)
    timeBlocks[4] = Math.floor(timeInMs / (1000 * 60)) %60
    timeBlocks[3] = Math.floor(timeInMs / (1000 * 60 * 60)) %24
    timeBlocks[2] = Math.floor(timeInMs / (1000 * 60 * 60 * 24)) %7
    timeBlocks[1] = Math.floor((timeInMs / (1000 * 60 * 60 * 24 * 7)) %52.2)
    timeBlocks[0] = Math.floor(timeInMs / (1000 * 60 * 60 * 24 * 365.25))

    let i = 0
    for (let timeBlock of timeBlocks) {
      if (timeBlock !== 0) {
        // console.log(`${timeBlock}${timeBlockUnits[i]} `)
        output += `${timeBlock}${timeBlockUnits[i]} `
      }
      i++
    }
  }
  return output
}

/**
 * Prints the formatted live trip data to the DOM.
 * 
 * Live trip data includes distance travelled and remaining, time elapsed and remaining.
 * @function printLiveTripData
 * @global
 * @param isReset {Boolean} If called by a reset event it will print blank strings to the DOM.
 */
const printLiveTripData = (isReset) => {
  let distanceTravelled = convertUnits(tripData.distanceTravelledPx, 'px', units, true).toLocaleString()
  let distanceRemaining = convertUnits(calculateDifference(tripData.destinationLeftPosPx, currentScrollPosition), 'px', units, true).toLocaleString()
  let timeElapsed = formatTime(tripData.tripElapsedMs)
  let timeRemaining = formatTime(tripData.tripDurationMs - tripData.tripElapsedMs)
  if (isReset) {
    distanceTravelled = ''
    distanceRemaining = ''
    timeElapsed = ''
    timeRemaining = ''
  }
  document.querySelector('#warpDistanceTravelled').innerHTML = distanceTravelled
  document.querySelector('#warpDistanceRemaining').innerHTML = distanceRemaining
  document.querySelector('#timeElapsed').innerHTML = timeElapsed
  document.querySelector('#timeRemaining').innerHTML = timeRemaining 
}

const setTripEnd = () => {
  isAtWarp = false
  tripData.tripStatus = 'complete'
  clearInterval(liveTripData)
  printLiveTripData()
}

//initiates trip calculates and prints them to the DOM
// const tripData = () => {
//   // let distanceInPx = tripDistance()
//   tripDurationInMs = calculateScrollRate(destination)
//   let convertedDistance = convertUnits(distanceInPx, 'px', units, true)
//   let warpFactor = document.querySelector('#warpInput').value
//   let convertedSpeed
//   if (warpFactor >= 0 && warpFactor < 10) {
//     convertedSpeed = convertUnits(warpSpeed(warpFactor), 'km', units, true).toLocaleString()
//   } else {
//     convertedSpeed = '&#x221e;'
//   }
//   //let convertedSpeed = convertUnits(warpSpeed(document.querySelector('#warpInput').value), 'km', units, true)
  
//   // displayUnits()
//   printTripData(convertedDistance, tripDurationInMs, convertedSpeed)
// }




// //calculates live timer
// const timer = (countDuration) => {
//   let currentCountUp = 0
//   let currentCountDown = 0
//   currentCountDown = countDuration
//   var counter = setInterval(function(){
//     document.querySelector('#timeRemaining').innerHTML = formatTime(currentCountDown)
//     document.querySelector('#timeElapsed').innerHTML = formatTime(currentCountUp)
//     if (isStop || currentCountDown <= 0) {
//       clearInterval(counter)
//     } else {
//       currentCountDown -= 20
//       currentCountUp += 20
//     }
//   }, 20)
// }




// //calculates trip distance in Px
// const tripDistance = () => {
//     let distance
//     if (origin !== '#stop-point') {
//       distance = $(destination).position().left - $(origin).position().left
//     } else {
//       distance = $(destination).position().left - document.documentElement.scrollLeft || document.body.scrollLeft
//     }
//     if (Math.sign(distance) === -1) {
//       distance = -(distance)
//     }
//     return distance
// }



// //Event listeners for smooth scrolling and trip data updates
// (() => {
//   //Navigation menu event listener
//   document.querySelector('.navigation').addEventListener("click", function(event) {
//     let theTarget = event.target
//     if (theTarget.getAttribute('href') !== null) {
//       theTarget = theTarget.getAttribute('href')
//       warpScroll(1500, theTarget, "easeInOutExpo");
//       // tripData()
//     }
//   })

//   //Wapr factor input event listener to update trip data
//   document.querySelector('#warpInput').addEventListener('change', function(){tripData()})

//   //Warp control panel event listener
//   document.querySelector('#warpControls').addEventListener("click", function(warpEvent){
//     let eventTarget = warpEvent.target
//     if (eventTarget.id === "origin") {
//       eventTarget.onchange = (changeEvent) => {
//           origin = eventTarget.value
//           warpScroll(1000, origin, "easeInOutExpo")
//       }
//     }

//     if (eventTarget.id === "destination") {
//       eventTarget.onchange = (changeEvent) => {
//           destination = eventTarget.value
//       }
//     }

//     if (eventTarget.id === "engage") {
//       let scrollRate = calculateScrollRate(destination)
//       timer(tripDurationInMs, false)
//       warpScroll(scrollRate, destination, "linear")
//     }

//     if (eventTarget.id === "stop") {
//       warpScroll(0, "#stop-point", 'linear')
//     }

//     if (eventTarget.id === "warpUnitSelect") {
//       eventTarget.onchange = () => {
//         units = eventTarget.value
//       }
//     }

//     //delay tripdata call when origin is clicked for accurate calculations
//     if(eventTarget.id === 'origin') {
//       setTimeout(originUpdate, 1001)
//       function originUpdate() {
//          tripData()
//          document.querySelector('#origin').options.selectedIndex = 0
//          origin = '#stop-point'
//       }
//     } else {
//       tripData()
//     }
//     liveScrollPos()
//   })
// })()

// //Event listeners for smooth scrolling and trip data updates
// (() => {
//   //Navigation menu event listener
//   document.querySelector('.navigation').addEventListener("click", function(event) {
//     let theTarget = event.target
//     if (theTarget.getAttribute('href') !== null) {
//       theTarget = theTarget.getAttribute('href')
//       warpScroll(1500, theTarget, "easeInOutExpo");
//       setTimeout(originUpdate, 1501)
//       function originUpdate() {
//          tripData()
//       }
//     }
//   })

//   //Wapr factor input event listener to update trip data
//   document.querySelector('#warpInput').addEventListener('change', function(){tripData()})

//   //Warp control panel event listener
//   document.querySelector('#warpControls').addEventListener("click", function(warpEvent){
//     let eventTarget = warpEvent.target
//     if (eventTarget.id === "origin") {
//       eventTarget.onchange = (changeEvent) => {
//           origin = eventTarget.value
//           warpScroll(1000, origin, "easeInOutExpo")
//       }
//     }

//     if (eventTarget.id === "destination") {
//       eventTarget.onchange = (changeEvent) => {
//           destination = eventTarget.value
//           tripData()
//       }
//     }

//     if (eventTarget.id === "engage") {
//       let scrollRate = calculateScrollRate(destination)
//       timer(tripDurationInMs, false)
//       warpScroll(scrollRate, destination, "linear")
//     }

//     if (eventTarget.id === "stop") {
//       timer(tripDurationInMs, true)
//       warpScroll(0, "#stop-point", 'linear')
//     }

//     if (eventTarget.id === "warpUnitSelect") {
//       eventTarget.onchange = () => {
//         units = eventTarget.value
//         displayUnits()
//         liveScrollPos()
//         tripData()
//       }
//     }

//     //delay tripdata call when origin is clicked for accurate calculations
//     if(eventTarget.id === 'origin') {
//       setTimeout(originUpdate, 1001)
//       function originUpdate() {
//          tripData()
//          document.querySelector('#origin').options.selectedIndex = 0
//          origin = '#stop-point'
//       }
//     } else {
//       // tripData()
//     }
//     // liveScrollPos()
//   })
// })()


