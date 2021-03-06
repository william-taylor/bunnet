import { Component } from '@angular/core';
import { FeedService } from '../../includes/all.services'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { GridOptions, IDatasource, IGetRowsParams } from "ag-grid-community";
import { Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
    selector: 'datafeed',
    templateUrl: './datafeed.component.html',
    styleUrls: ['./datafeed.component.css']
})
export class DataFeedComponent implements IDatasource {
    private activeFeed: string;
    private gridOptions: GridOptions;
    private stompClient = null;

    constructor(private route: ActivatedRoute, private feeds: FeedService, router: Router) {
        this.gridOptions = <GridOptions>{};
        this.gridOptions.enableColResize = true;
        this.gridOptions.enableFilter = true;
        this.gridOptions.enableSorting = true;
        this.gridOptions.columnDefs = [
            { headerName: 'Column 1', field: 'col1' },
            { headerName: 'Column 2', field: 'col2' },
            { headerName: 'Column 3', field: 'col3' },
            { headerName: 'Column 4', field: 'col4' },
            { headerName: 'Column 5', field: 'col5' },
            { headerName: 'Column 6', field: 'col6' },
        ];

        this.gridOptions.rowData = new Array(1000).fill(0).map(i => this.newRow());
        this.gridOptions.enableServerSideFilter = true;
        this.gridOptions.enableServerSideSorting = true;
        this.gridOptions.rowModelType = 'infinite';
        this.gridOptions.datasource = this;
        this.gridOptions.onGridReady = (params) => {
            params.api.sizeColumnsToFit();
        }
        //this.connect();

        router.events.subscribe(val => {
            if (val instanceof NavigationEnd) {
                let feed = this.route.snapshot.paramMap.get('feed');
                if (this.activeFeed != feed) {
                    this.reloadFeedData(feed);
                }
            }
        });
    }

    getRows(params: IGetRowsParams) {
        let data = this.gridOptions.rowData;
        params.sortModel.forEach(s => {
            data = data.sort((a, b) => a[s.colId] - b[s.colId]);
            if (s.sort !== 'desc') {
                data = data.reverse();
            }
        })

        params.successCallback(data.slice(params.startRow, params.endRow));
    }

    newRow() {
        return {
            col1: Math.random() * 100,
            col2: Math.random() * 100,
            col3: Math.random() * 100,
            col4: Math.random() * 100,
            col5: Math.random() * 100,
            col6: Math.random() * 100
        };
    }

    reloadFeedData(feed) {
        this.activeFeed = feed;
    }

    disableSystemTab(system: string) {
        return !this.feeds.systemFeedAvailable(system);
    }

    connect() {
        const socket = new SockJS('http://localhost:8080/socket');
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({}, frame => {
            this.stompClient.subscribe('/response/filenames', data => {
                const filenames = JSON.parse(data.body);
                console.log(filenames);
            });
        });        
    }

    disconnect() {
        if (this.stompClient != null) {
            this.stompClient.disconnect();
        }

        console.log('Disconnected!');
    }
}
