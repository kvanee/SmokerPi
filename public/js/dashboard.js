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
				label: "Smoker Temperature",
				data:[]
			}]
		},
		options: {
        		scales: {
						yAxes: [{
							ticks: {
								min: 200,
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

	$.getJSON("/loadPastSessions" , function(data) {
		data.forEach((item) => {
			//TODO: autocomplete Name.
		});
	});
	
	var loadChartData = function(){
		$.getJSON("/loadChartData/" + $("#sessionName").val(), function(data) {
			myChart.data.labels.length = 0;
			myChart.data.datasets[0].data.length = 0;
			data.forEach((item) => {
				myChart.data.labels.push(item.time);
				myChart.data.datasets[0].data.push(item.currTemp);
			});
			myChart.update();
		});
	};			
	loadChartData();
	socket.on('updateTemp', function(data){
		//TODO: dont add data if session is historical.
		$("#currTemp").text(data.currTemp + "°F");
		if($('input[name=setLogState]:checked').val() == "on") {
			myChart.data.labels.push(data.time);
			myChart.data.datasets[0].data.push(data.currTemp);
			myChart.update();
		}
  
		if(data.isBlowerOn)
			$("#currTemp").css('color', 'red');
		else
			$("#currTemp").css('color', 'green');
	});	

	$('#sessionName').change(function(){
		socket.emit('setSessionName', this.value);
		loadChartData();
	});
	socket.on('setSessionName', function(data){
		$('#sessionName').val(data);
		loadChartData();
	});
	$('#targetTemp').change(function(){
		socket.emit('setTargetTemp', this.value);
	});
	socket.on('setTargetTemp', function(data){
		$('#targetTemp').val(data);
	});
	$('input[type=radio][name=setBlowerState]').change(function() {
        socket.emit('setBlowerState', this.value);
	});
	socket.on('setBlowerState', function(data){
		$('input[type=radio][name=setBlowerState][value="'+data+'"]').prop("checked", true);
		$('input[name=setBlowerState]').parent().removeClass('active');
		$('input[name=setBlowerState]:checked').parent().addClass('active');
	});
	$('input[type=radio][name=setLogState]').change(function() {
        socket.emit('setLogState', this.value);
    });
	socket.on('setLogState', function(data){
		$('input[type=radio][name=setLogState][value="'+data+'"]').prop("checked", true);
		$('input[name=setLogState]').parent().removeClass('active');
		$('input[name=setLogState]:checked').parent().addClass('active');
	});
});