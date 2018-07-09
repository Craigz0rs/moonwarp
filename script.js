const c = 299792 //km/s in vacuum
const kmInPx = 3474.2 //1px = 3474.2km (mean diameter of moon)

//ratio scale is to 1km
const distanceRatio = { 
    km: 1,
    mi: 1.60934,
    au: 149597870.7,
    ly: 9460730472580.8,
    lsec: 299792, 
    lmin: 17987520
}

//probe objects used for calculating actual current distance from the sun
const probes = [
    {
        name: 'voyager1',
        speed: 17,
        referenceDate: new Date(2018, 6, 8, 17, 26, 00, 00),
        referenceDistance: 21330068000
    },
    {
        name: 'voyager2',
        speed: 15.4,
        referenceDate: new Date(2018, 6, 8, 17, 28, 00, 00),
        referenceDistance: 17649401340
    },
    {
        name: 'new-horizons',
        speed: 14.1,
        referenceDate: new Date(2018, 6, 8, 14, 50, 00, 00),
        referenceDistance: 6260518000
    }
]

//returns the current actual distance from the Sun in px
const currentProbeLocation = (probeSpeed, probeRefDistance, probeRefDate) => (probeRefDistance / kmInPx) + ((probeSpeed / kmInPx) * ((new Date() - probeRefDate) / 1000))

//updates probe positions in browser and updates distance counters every 100ms
const updateProbes = setInterval(() => {
    for (let probe of probes) {
        let distanceInPx = currentProbeLocation(probe.speed, probe.referenceDistance, probe.referenceDate)
        let distanceInKm = Math.round(distanceInPx * kmInPx)
        document.querySelector(`#${probe.name}`).style.left = `${Math.round(distanceInPx)}px`
        // console.log(distanceInKm)
    }    
}, 100)

//calculates warp speed as multiple of c in km/s by inputting warp factor
const warpSpeed = (warpFactor) => {
    //equation calculates multiple of c for warp factors <= 9
    const warpEquation = (factor) => Math.pow(factor, (10/3)) 
    let lightMultiple = undefined

    if (warpFactor >= 10) {
        lightMultiple = infinite
    } else if (warpFactor <= 9) {
        lightMultiple = warpEquation(warpFactor)
    } else if (warpFactor > 9 && warpFactor <= 9.9) {
        let rounded = Math.round(warpFactor * 10) / 10
        switch(rounded) {
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
    } else if (warpFactor == 9.975) {
        lightMultiple = 4364
    } else if (warpFactor == 9.985) {
        lightMultiple = 5829
    }
    return lightMultiple * c
}

//Calculates 
let currentDistance = (unit) => {

}