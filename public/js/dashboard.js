$( document ).ready(function() {
	var socket = io();

	$('input[name=setBlowerState]:checked').parent().addClass('active');
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
			$("#sessionDropDown").append('<a class="dropdown-item" href="/dashboard/'+item._id+'">'+item.startDate +'</a>')
		});
		$(".dropdown-toggle").dropdown();
	});
	
	$.getJSON("/loadChartData/" + $("#sessionId").val(), function(data) {
		myChart.data.labels.length = 0;
		myChart.data.datasets[0].data.length = 0;
		data.forEach((item) => {
			myChart.data.labels.push(item.time);
			myChart.data.datasets[0].data.push(item.currTemp);
		});
		myChart.update();
    });
	
	socket.on('updateTemp', function(data){
		//TODO: dont add data if session is historical.
		$("#currTemp").text(data.currTemp);
		myChart.data.labels.push(data.time);
		myChart.data.datasets[0].data.push(data.currTemp);
    	myChart.update();
  
		if(data.isBlowerOn)
			$("#currTemp").css('color', 'red');
		else
			$("#currTemp").css('color', 'green');
	});	

	$('input[type=radio][name=setBlowerState]').change(function() {
        socket.emit('setBlowerState', this.value);
    });


});