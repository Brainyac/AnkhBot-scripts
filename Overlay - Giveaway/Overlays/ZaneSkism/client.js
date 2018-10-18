var vm = new Vue({
  el: '#app',
  data: {
    showHeader: false,
    showWinner: false,
    firstEntry: false,
    interval: Object,
    header: {
      command: '',
      prize: '',
      permission: '',
      info: '',
      ticketCost: '',
      maxTickets: '',
      currency: '',
      timer: 0
    },
    entries: {},
    winner: {
      name: '',
      tickets: ''
    }
  },
  filters: {
    two_digits: function (value) {
      if (value.toString().length <= 1) {
        return "0" + value.toString();
      }
      return value.toString();
    }
  },
  computed: {
    seconds() {
      return this.header.timer % 60;
    },

    minutes() {
      return Math.trunc(this.header.timer / 60) % 60;
    },

    hours() {
      return Math.trunc(this.header.timer / 60 / 60) % 24;
    }
  },
  mounted: function () {
    this.serviceUrl = API_Socket;
    this.socket = new WebSocket(this.serviceUrl);

    this.socket.onopen = function () {
      // Format your Authentication Information
      var auth = {
        author: 'Brain',
        website: 'http://www.brains-world.eu',
        api_key: API_Key,
        events: ['EVENT_GIVEAWAY_START',
          'EVENT_GIVEAWAY_STOP',
          'EVENT_GIVEAWAY_ABORT',
          'EVENT_GIVEAWAY_ENTER',
          'EVENT_GIVEAWAY_UPDATE',
          'EVENT_GIVEAWAY_WINNER'
        ]
      };
      //  Send your Data to the server
      vm.socket.send(JSON.stringify(auth));
    };
    //---------------------------------
    //  Error Event
    //---------------------------------
    this.socket.onerror = function (error) {
      //  Something went terribly wrong... Respond?!
      console.log('Error: ' + error);
    };
    //---------------------------------
    //  Message Event
    //---------------------------------
    this.socket.onmessage = function (message) {
      var json = JSON.parse(message.data);
      if (json.event == 'EVENT_GIVEAWAY_START') {
        var eventData = JSON.parse(json.data);
        console.log("Event Start: " + eventData);
        vm.showHeader = true;
        vm.header.command = eventData.command;
        vm.header.prize = eventData.prize;
        vm.header.permission = eventData.permission;
        vm.header.info = eventData.info;
        vm.header.ticketCost = eventData.fee;
        vm.header.maxTickets = eventData.max_tickets;
        vm.header.currency = eventData.currency_name;
        vm.header.timer = eventData.timer;

        clearInterval(vm.interval);

        vm.interval = setInterval(() => {
          vm.header.timer -= 1;
          if (vm.header.timer < 0) {
            vm.header.timer = 0;
          }
        }, 1000);

        for (var x in eventData.entries) {
          vm.firstEntry = true;
          Vue.set(vm.entries, eventData.entries[x].userid, {
            name: eventData.entries[x].name,
            tickets: eventData.entries[x].tickets
          });
        }
      } else if (json.event == 'EVENT_GIVEAWAY_ENTER' || json.event == 'EVENT_GIVEAWAY_UPDATE') {
        vm.firstEntry = true;
        var eventData = JSON.parse(json.data);
        console.log(eventData);
        Vue.set(vm.entries, eventData.userid, {
          name: eventData.name,
          tickets: eventData.tickets
        });
        clearInterval(vm.interval);
      } else if (json.event == 'EVENT_GIVEAWAY_STOP') {
        //  do stuff
        vm.header.timer = 0;
        clearInterval(vm.interval);

      } else if (json.event == 'EVENT_GIVEAWAY_ABORT') {
        vm.showHeader = false;
        vm.entries = {};
        vm.header.timer = 0;
        vm.showWinner = false;
        vm.firstEntry = false;
        clearInterval(vm.interval);

      } else if (json.event == 'EVENT_GIVEAWAY_WINNER') {
        vm.showWinner = true;
        var eventData = JSON.parse(json.data);
        vm.winner.name = eventData.name;
        vm.winner.tickets = eventData.tickets;
      }
      //  You have received new data now process it
      console.log("New Data");
      console.log(json);
    };
    //---------------------------------
    //  Message Event
    //---------------------------------
    this.socket.onclose = function () {
      //  Connection has been closed by you or the server
      console.log("Connection Closed!");
    };
  }
});