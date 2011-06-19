(function() {
    bh.ui = {};
    bh.ui.categoriesWindow = null;
    bh.ui.areasWindow = null;
    bh.ui.alarmsWindow = null;
    
    bh.ui.tabGroup = null;
    bh.ui.alarmsTab = null;
    bh.ui.mapView = null;
    
    bh.ui.createAlarmsWindow = function() {
        var win = Titanium.UI.createWindow({
            title : L('alarms')
        });

        var tableView = bh.ui.createAlarmsTableView();

        var add = Titanium.UI.createButton({
            title : L('add'),
            style : Titanium.UI.iPhone.SystemButtonStyle.PLAIN
        });

        var edit = Titanium.UI.createButton({
            title : L('edit')
        });

        var cancel = Titanium.UI.createButton({
            title : L('cancel'),
            style : Titanium.UI.iPhone.SystemButtonStyle.DONE
        });

        add.addEventListener('click', function() {
            bh.ui.categoriesWindow = bh.ui.createCategoriesWindow();
            bh.ui.categoriesWindow.open({modal:true});
        });

        edit.addEventListener('click', function() {
            win.setLeftNavButton(cancel);
            win.setRightNavButton(null);
            tableView.editing = true;
        });

        cancel.addEventListener('click', function() {
            win.setRightNavButton(add);
            win.setLeftNavButton(edit);
            tableView.editing = false;
        });

        win.add(tableView);
        win.setLeftNavButton(edit);
        win.setRightNavButton(add);

        return win;
    };

    bh.ui.createMapWindow = function() {
        var win = Titanium.UI.createWindow({
            title : L('map')
        });
		
		var userRegion = {
			latitude: bh.coords.latitude,
			longitude: bh.coords.longitude,
			latitudeDelta: 0.01,
			longitudeDelta: 0.01
		};

		// Creates map view
		bh.ui.mapView = Titanium.Map.createView({
			mapType: Titanium.Map.STANDARD_TYPE,
			region: userRegion,
			animate: true,
			regionFit: true,
			userLocation: true
		});
		
		bh.ui.annotations = [];
				
		function populateAnnotations() {
			var data = bh.db.listAlarms();
			
			// Remove annotations
			bh.ui.mapView.removeAllAnnotations();
			bh.ui.annotations = [];

			for (var i = 0; i < data.length; i++) {
				if (data[i].latitude && data[i].longitude) {
					Titanium.API.log(data[i].latitude + ', ' + data[i].longitude);
					var newAnnotation = Titanium.Map.createAnnotation({
						latitude: data[i].latitude,
						longitude: data[i].longitude,
						title: data[i].name,
						subtitle: data[i].latitude + ',' + data[i].longitude,
						animate: true,
						leftButton: 'images/mini-icons/03-clock.png'
					});
					
					bh.ui.annotations.push(newAnnotation);
					bh.ui.mapView.addAnnotation(newAnnotation);
				}
			}
		}
		
        Ti.App.addEventListener('databaseUpdatedNew', populateAnnotations);
		populateAnnotations();

        var center = Titanium.UI.createButton({
            title : L('center'),
            style : Titanium.UI.iPhone.SystemButtonStyle.PLAIN
        });
        center.addEventListener('click', function() {
			bh.ui.mapView.setLocation(Qpqp.Map.getCenterRegion(bh.ui.annotations));
        });
        win.setRightNavButton(center);

		// button to change to ATL
		atl = Titanium.UI.createButton({
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
			title:'ATL'
		});
		
		// activate annotation
		if (bh.ui.annotations.length > 0) {
			bh.ui.mapView.selectAnnotation(bh.ui.annotations[0].title, true);
		}
		
		// button to change to SV	
		sv = Titanium.UI.createButton({
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
			title:'SV'
		});
		
		bh.ui.mapView.addEventListener('complete', function()
		{
			Ti.API.info("map has completed loaded region");
		});
		
		var flexSpace = Titanium.UI.createButton({
			systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
		});
		
		// button to change map type to SAT
		sat = Titanium.UI.createButton({
			title:'Sat',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
		// button to change map type to STD
		std = Titanium.UI.createButton({
			title:'Std',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
		// button to change map type to HYBRID
		hyb = Titanium.UI.createButton({
			title:'Hyb',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
		// button to zoom-in
		zoomin = Titanium.UI.createButton({
			title:'+',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
		// button to zoom-out
		zoomout = Titanium.UI.createButton({
			title:'-',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
	
		var wireClickHandlers = function() {
			
			sat.addEventListener('click',function() {
				// set map type to satellite
				bh.ui.mapView.setMapType(Titanium.Map.SATELLITE_TYPE);
			});
			
			std.addEventListener('click',function() {
				// set map type to standard
				bh.ui.mapView.setMapType(Titanium.Map.STANDARD_TYPE);
			});
			
			hyb.addEventListener('click',function() {
				// set map type to hybrid
				bh.ui.mapView.setMapType(Titanium.Map.HYBRID_TYPE);
			});
			
			zoomin.addEventListener('click',function() {
				bh.ui.mapView.zoom(1);
			});
			
			zoomout.addEventListener('click',function() {
				bh.ui.mapView.zoom(-1);
			});
		};
		wireClickHandlers();
		win.setToolbar([std,hyb,sat,flexSpace,zoomin,zoomout]);
		win.add(bh.ui.mapView);

        return win;
    };

    bh.ui.createCategoriesWindow = function() {
        var win = Ti.UI.createWindow({
            title : L('lines')
        });
        
        var b = Titanium.UI.createButton({
            title : L('close'),
            style : Titanium.UI.iPhone.SystemButtonStyle.PLAIN
        });
        b.addEventListener('click', function() {
            win.close();
        });
        win.setRightNavButton(b);

        win.add(bh.ui.createCategoriesTableView());
        return win;
    };

    bh.ui.createAlarmsTableView = function() {
        var tv = Ti.UI.createTableView({
            editable : true,
            allowsSelection : false,
            allowsSelectionDuringEditing : false
        });

        tv.addEventListener('delete', function(_e) {
            // Delete the alarm
            bh.db.deleteAlarm(_e.rowData.id, false);
        });

        function populateData() {
            var results = bh.db.listAlarms();
            tv.setData(results);
        }
        Ti.App.addEventListener('databaseUpdated', populateData);

        populateData();

        return tv;
    };

    bh.ui.createCategoriesTableView = function() {
		var search = Titanium.UI.createSearchBar();

		// create table view
        var tv = Ti.UI.createTableView({
			search:search
		});

        tv.addEventListener('click', function(_e) {
            // Execute delete or save
            var active = _e.row.hasCheck;
            if (active) {
                bh.db.deleteAlarm(_e.rowData.id, true);
            } else {
                bh.db.addAlarm(_e.rowData.id);
            }
			_e.row.hasCheck = !_e.row.hasCheck;
            
            var sections = tv.data;
            var rowId = _e.rowData.id;

            for (var i = 0; i < sections.length; i++) {
				var section = sections[i];
			 
			    for(var j = 0; j < section.rowCount; j++) {
					if (section.rows[j].id == rowId) {
						section.rows[j].hasCheck = !active;
					}
			    }
            }
        });

        function populateData() {
            var results = bh.db.listFullCategories();
            tv.setData(results);
        }

        // run initial query
        populateData();

        return tv;
    };

    bh.ui.createAreasTableView = function(_category) {
        var tv = Ti.UI.createTableView();

        tv.addEventListener('click', function(_e) {
            // Execute delete or save
            var active = _e.row.hasCheck;
            if (active) {
                bh.db.deleteAlarm(_e.rowData.id, true);
            } else {
                bh.db.addAlarm(_e.rowData.id);
            }
            _e.row.hasCheck = !_e.row.hasCheck;
        });

        function populateData() {
            var results = bh.db.listAreas(_category);
            tv.setData(results);
        }

        // run initial query
        populateData();

        return tv;
    };

    bh.ui.createApplicationTabGroup = function() {
        var tabGroup = Titanium.UI.createTabGroup();
        bh.ui.tabGroup = tabGroup;

        var alarms = bh.ui.createAlarmsWindow();
        var map = bh.ui.createMapWindow();
        // var options = bh.ui.createAlarmsWindow();

        bh.ui.alarmsTab = Titanium.UI.createTab({
            icon : 'images/icons/11-clock@2x.png',
            title : L('alarms'),
            window : alarms
        });

        bh.ui.mapTab = Titanium.UI.createTab({
            icon : 'images/icons/07-map-marker@2x.png',
            title : L('map'),
            window : map
        });

        tabGroup.addTab(bh.ui.alarmsTab);
        tabGroup.addTab(bh.ui.mapTab);

        return tabGroup;
    };
})();