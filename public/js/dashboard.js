$( document ).ready(function() {
	var socket = io();

	$('input[name=setBlowerState]:checked').parent().addClass('active');
	$('input[name=setLogState]:checked').parent().addClass('active');
	
	var ctx = document.getElementById('myChart').getContext('2d');
	var myChart = new Chart(ctx, {
		type: 'line',
		data: {
        		labels: [],
			datasets: [{
				label: "Meat Temperature",
				data:[],
				fill: false,
				pointBackgroundColor: "#FF9600",
				backgroundColor: "#FF9600",
				borderColor: "#FF9600"
			},{
				label: "Smoker Temperature",
				data:[],
				pointBackgroundColor: "#303030",
				backgroundColor: "#151515CC",
				borderColor: "#151515"
			}]
		},
		options: {
			title: {
				display: false,
				text: $("#sessionName").val()
			},
			scales: {
					yAxes: [{
						ticks: {
							min: 70,
							max: 300
						}
					}],
					xAxes: [{
						time: {
								unit: 'second'
						}
					}]
			}
    	}
	});

	var loadChartData = function(){
		console.log("get Chart Data");
		$.getJSON("/session/loadChartData/" + $("#sessionName").val(), function(data) {
			console.log("got Chart Data");
			myChart.data.labels.length = 0;
			myChart.data.datasets[1].data.length = 0;
			myChart.data.datasets[0].data.length = 0;
			data.forEach((item) => {
				myChart.data.labels.push(item.time);
				myChart.data.datasets[1].data.push(item.currBbqTemp);
				myChart.data.datasets[0].data.push(item.currMeatTemp);
			});
			myChart.update();
		});
	};			
	loadChartData();
	socket.on('updateTemp', function(data){
		$("#currBbqTemp").text("Smoker: " + data.currBbqTemp + "°F");
		$("#currMeatTemp").text("Meat: " + data.currMeatTemp + "°F");
		if($('input[name=setLogState]:checked').val() == "on") {
			myChart.data.labels.push(data.time);
			myChart.data.datasets[1].data.push(data.currBbqTemp);
			myChart.data.datasets[0].data.push(data.currMeatTemp);
			myChart.update();
		}
  
		if(data.isBlowerOn)
			$("#currBbqTemp").css('color', 'red');
		else
			$("#currBbqTemp").css('color', 'green');
	});	

	$('#saveNewSession').click(function(){
		socket.emit('saveSessionName', {
			sessionName: $('#sessionName').val(),
			password: $('#password').val()
		});
	});
	socket.on('setSessionName', function(data){
		$('#sessionName').val(data);
		myChart.options.title.text = data;
    	myChart.update();
		loadChartData();
	});
	$('input[type=radio][name=setBlowerState]').change(function() {
        socket.emit('setBlowerState', {
			password: $('#password').val(),
			blowerState: this.value
		});
	});
	socket.on('setBlowerState', function(data){
		$('input[type=radio][name=setBlowerState][value="'+data+'"]').prop("checked", true);
		$('input[name=setBlowerState]').parent().removeClass('active');
		$('input[name=setBlowerState]:checked').parent().addClass('active');
	});
	$('input[type=radio][name=setLogState]').change(function() {
        socket.emit('setLogState', {
			password: $('#password').val(),
			logState: this.value
		});
    });
	socket.on('setLogState', function(data){
		$('input[type=radio][name=setLogState][value="'+data+'"]').prop("checked", true);
		$('input[name=setLogState]').parent().removeClass('active');
		$('input[name=setLogState]:checked').parent().addClass('active');
	});
	$('#saveSettings').click(function(){
		socket.emit('saveSettings', {
			password: $('#sessionPassword').val(),
			targetTemp: $('#targetTemp').val(),
			alertHigh: $('#alertHigh').val(),
			alertLow: $('#alertLow').val(),
			alertMeat: $('#alertMeat').val()
		});
	});
	$('#cancelSettings').click(function(){
		socket.emit('getSettings');
	});
	socket.on('updateSettings', function(data){
		$('#targetTemp').val(data.targetTemp);
		$('#alertHigh').val(data.alertHigh);
		$('#alertLow').val(data.alertLow);
		$('#alertMeat').val(data.alertMeat)
	});
});