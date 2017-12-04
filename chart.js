let margin = { top: 20, right: 30, bottom: 30, left: 30 };
let constant = {
	width: 600 - margin.left - margin.right,
	height: 500 - margin.top - margin.bottom,
	x: d3.scaleBand().rangeRound([0, 600 - margin.right]).padding(0.05),
	y: d3.scaleLinear().rangeRound([500 - margin.top - margin.bottom, 0])
};

let svg =  d3.select('.birth-chart');
let g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');




/* DATA MODULE */
let data = function() {
	// dataset referenced throughout this visualization
	let dataObject = {};

	function loadData() {
		d3.json('births.json', function(err, birthsData){
			if(err) {
				console.log('The data did not load. Please refresh the page.');
			}
			data.obj = birthsData;

			// kick off chart creation methods
			staticElements.xAxis();
			staticElements.yAxis();
			staticElements.bars();
			staticElements.circles();
		});
	}

	return {
		obj: dataObject,
		load: loadData
	}
}();

// contains x-axis and y-axis -- elements run once and left alone
/* STATIC ELEMENTS MODULE */
let staticElements = function() {

	function createXAxis() {
		constant.x.domain(data.obj.map(function(d) { return d.abbreviation; }));

		//define x axis
		g.append('g')
			.attr('class', 'x-axis')
			.style('stroke-width', '.1')
			.attr('transform', 'translate(0,' + constant.height + ')')
		.call(d3.axisBottom(constant.x).tickSizeOuter(0).tickSizeInner(0))
			.append('text')
			.attr('y', 30)
			.attr('x', 400)
			.attr('dy', '0.5em')
			.style('fill', 'black');

		// transform text on x axis
		g.selectAll('.x-axis text')
			.style('transform', 'translateY(15px)translateX(-9px) rotate(-90deg)');
	}

	function createYAxis() {
		let maxVal = helper.findMax();
		constant.y.domain([0, maxVal]);

		// define y axis
		g.append('g')
			.attr('class', 'axis axis-y')
			.style('stroke-width', '.1')
			.call(d3.axisLeft(constant.y).tickSizeOuter(0).tickSizeInner(0));

	}

	function createBars() {
		g.selectAll('.bar')
			.data(data.obj)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', function(d) { return constant.x(d.abbreviation); })
			.attr('y', function(d, i) { return constant.y(helper.getCurrRate(i)); })
			.attr('height', function(d, i) { return constant.height - constant.y(helper.getCurrRate(i)) ;})
			.attr('width', constant.x.bandwidth()/4);
	}
	// load circles
	function createCircles() {
		g.selectAll('.circle')
			.data(data.obj)
			.enter()
			.append('circle')
			.attr('class', 'circle')
			.attr('cx', function(d) { return constant.x(d.abbreviation) + 1; })
			.attr('cy', function(d, i) { return constant.y(helper.getCurrRate(i)); })
			.attr('r', 4)
			.attr('stroke', 'black')
			.attr('stroke-width', '0.5')
			.style('fill', 'white');
	}

	return {
		xAxis: createXAxis,
		yAxis: createYAxis,
		bars: createBars,
		circles: createCircles
	}
}();

/* DYNAMIC ELEMENTS MODULE */
let dynamicElements = function() {

	let transition = d3.transition()
		.duration(500)
		.ease(d3.easeLinear);

	function updateBarHeight() {
		g.selectAll('.bar')
			.transition(transition)
			.attr('y', function(d, i) { return constant.y(helper.getCurrRate(i)); })
			.attr('height', function(d, i) { return constant.height - constant.y(helper.getCurrRate(i)) ;});

	}

	function updateCircleHeight() {
		g.selectAll('.circle')
			.transition(transition)
			.attr('cy', function(d, i) { return constant.y(helper.getCurrRate(i)); });
	}

	function updateCircleFill() {
		g.selectAll('.circle')
			.style('fill', function(d,i) { return helper.getFill(i); });
	}

	return {
		updateBars: updateBarHeight,
		updateCircles: updateCircleHeight,
		updateFill: updateCircleFill
	}
}();


/* TOOLTIP MODULE */
let tooltip = function() {
	// create tooltip element
	// set text for tooltip

	return {

	}
}();

/* PLAY MODULE */
let play = function() {
	let isPlaying = false;

	function playYears() {
		let cycleYears = window.setInterval(function() {
			if(play.isPlaying) {
				if(helper.currentYear < 2015) {
					helper.currentYear++;
					updateYearElem();
				} else {
					helper.currentYear = 1990;
					updateYearElem();
				}
			} else {
				resetYears();
				clearInterval(cycleYears);
			}
		}, 1200);

	}

	function resetYears() {
		play.isPlaying = false;
	}

	function handleYearClick(evt) {
		let direction = evt.target.dataset.direction;
		
		if(!direction) {
			return;
		} else if(direction === 'forward' && helper.currentYear === 2015) {
			helper.currentYear = 1990;
		} else if (direction === 'forward') {
			helper.currentYear++;
		} else if (direction === 'backward' && helper.currentYear === 1990) {
			helper.currentYear = 2015;
		} else if (direction === 'backward') {
			helper.currentYear--;
		}

		updateYearElem();
	}

	function handleYearButton(evt) {
		let playBtn = evt.target;

		play.isPlaying = !play.isPlaying;

		if(play.isPlaying) {
			playBtn.setAttribute('id', 'on');
			playYears();
		} else {
			playBtn.setAttribute('id', 'off');
		}


	}

	function updateYearElem() {
		let yearElem = document.querySelector('.year-display');
		yearElem.textContent = helper.currentYear;

		//kick off bar updates
		dynamicElements.updateBars();
		dynamicElements.updateCircles();
		dynamicElements.updateFill();
	}

	return {
		handleClick: handleYearClick,
		handleButton: handleYearButton

	}
}();


let helper = function() {
	let currentYear = 1990;
	// get current birth rate
	function getCurrentRate(index) {
		return +data.obj[index].data[helper.currentYear-1990].rate;
	}

	function getCurrentCount(index) {
		return +data.obj[index].data[helper.currentYear-1990].count;
	}
	
	function getPrevRate(index) {
		if(helper.currentYear !== 1990) 
			return +data.obj[index].data[helper.currentYear-1990-1].rate;
	}

		function getPrevCount(index) {
		if(helper.currentYear !== 1990)
			return +data.obj[index].data[helper.currentYear-1990-1].count;
	}

	function getDifference(index) {
		let currentYearVal = getCurrentCount(index);
		let prevYearVal = getPrevCount(index);

		if(helper.currentYear === 1990) {
			return 'No data';
		} else {
			// get percentage difference
			return (currentYearVal - prevYearVal)/currentYearVal*100;
		}
	}

	function getCircleFill(index) {
		let diff = getDifference(index);

		if(diff === 'No data') {
			return 'white';
		} else if (diff >= 0) {
			return '#66b7db';
		} else {
			return '#c96a9f';
		}
	}

	function findMaxBirthRate() {
		let maxVals = [];
		for(let i = 0; i < data.obj.length; i++) {
			let maxEntry = data.obj[i].data.reduce(function(prev, curr){
				if(prev.rate) {
					return (prev.rate > curr.rate) ? +prev.rate : +curr.rate;
				} 
				return (prev > curr.rate) ? +prev : +curr.rate;
			});

			maxVals.push(maxEntry);
		}

		return Math.max(...maxVals);

	}

	return {
		findMax: findMaxBirthRate,
		currentYear: currentYear,
		getCurrRate: getCurrentRate,
		getFill: getCircleFill
	};
}();


/* BROWSER EVENTS */
let yearArea = document.querySelector('.year-area');
yearArea.addEventListener('click', play.handleClick);

let buttonArea = document.querySelector('.play-btn');
buttonArea.addEventListener('click', play.handleButton); 

data.load();

// todo
// 4 - add tooltip and tooltip text
// think about how to represent increase/decrease in words