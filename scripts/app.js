// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


(function() {
  'use strict';

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    articleTemplate: document.querySelector('.articleCardTemplate'),
    containerHome: document.querySelector('.mainHome'),
    containerArticle: document.querySelector('.mainArticle'),
    addDialog: document.querySelector('.dialog-container'),
    // daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById('butLogo').addEventListener('click', function() {
    // Go Home
    app.getHome();
  });
  document.getElementById('butRefresh').addEventListener('click', function() {
    // Refresh all of the forecasts
    app.getHome();
  });

  // document.getElementById('butAdd').addEventListener('click', function() {
  //   // Open/show the add new city dialog
  //   app.toggleAddDialog(true);
  // });

  // document.getElementById('butAddCity').addEventListener('click', function() {
  //   // Add the newly selected city
  //   var select = document.getElementById('selectCityToAdd');
  //   var selected = select.options[select.selectedIndex];
  //   var key = selected.value;
  //   var label = selected.textContent;
  //   if (!app.selectedCities) {
  //     app.selectedCities = [];
  //   }
  //   app.getForecast(key, label);
  //   app.selectedCities.push({key: key, label: label});
  //   app.saveSelectedCities();
  //   app.toggleAddDialog(false);
  // });

  // document.getElementById('butAddCancel').addEventListener('click', function() {
  //   // Close the add new city dialog
  //   app.toggleAddDialog(false);
  // });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  app.showHome = function(data) {
    var container = app.containerHome;

    // show articles
    if(data.list) {
        for(var i=data.list.length-1; i>=0; i--) {
            var article = data.list[i];
            var key = 'article_' + article.id;
            var card = app.visibleCards[key];

            if (!card) {
                card = app.articleTemplate.cloneNode(true);
                card.classList.remove('articleCardTemplate');
                card.removeAttribute('hidden');
                container.insertBefore(card, container.firstChild);
                app.visibleCards[key] = card;
            }

            try {
                var d = new Date(article.date_published * 1000);
                card.dataset.id = article.id;
                if(article.medias.length)
                    card.querySelector('.image').src = article.medias[0].image.replace('[WBFORMAT]', '100x100').replace('http://static1.', 'https://static1-ssl.');
                card.querySelector('.date').textContent = [d.getDate(), (d.getMonth() + 1)].join('/') + ' ' + [d.getHours(), d.getMinutes()].join(':');
                card.querySelector('.date').textContent += ' (updated at ' + (new Date()).toISOString() + ')';
                card.querySelector('.title').textContent = article.title;

                card.addEventListener('click', function(e) {
                    var id = e.target.dataset.id;
                    if(!id) {
                        id = e.target.closest('.articleCard').dataset.id;
                    }
                    app.getArticle(id);
                });
            } catch(e) {
                console.log(e, article);
            }
        };
    }

    app.containerArticle.setAttribute('hidden', true);
    container.removeAttribute('hidden');
    app.setLoading(false);
  };

  app.showArticle = function(data) {
    app.setLoading(true);
    var container = app.containerArticle,
        body = '', intro = '', medias = [];

    container.querySelector('.title').textContent = data.title;
    data.body.forEach(function(block){
        if(block.type == 'text') {
            body += block.text;
        } else if(block.type == 'intro') {
            intro += block.text;
        } else if(block.type == 'medias') {
            medias = medias.concat(block.medias);
        }
    });
    container.querySelector('.intro').innerHTML = intro;
    container.querySelector('.body').innerHTML = body;

    container.querySelector('.slideshow').innerHTML = '';
    medias.forEach(function(media) {
        var img = new Image();
        img.src = media.image.replace('[WBFORMAT]', '100x100').replace('http://static1.', 'https://static1-ssl.');
        container.querySelector('.slideshow').appendChild(img);
    });

    app.containerHome.setAttribute('hidden', true);
    container.removeAttribute('hidden');
    app.setLoading(false);
  };

  app.setLoading = function(status) {
    if(!!status) {
        app.spinner.removeAttribute('hidden');
    } else {
        app.spinner.setAttribute('hidden', true);
    }
    app.isLoading = !!status;
  }

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

    app.getHome = function() {
        var url = 'https://www.purepeople.com/mobile/v3/hp/device/android';
//         var url = 'https://secure.webedia.fr/pxy.php?q=http://www.purepeople.com/mobile/v3/hp/device/android';

        // Cache logic here
        if ('caches' in window) {
          /*
           * Check if the service worker has already cached this request
           * data. If the service worker has the data, then display the cached
           * data while the app fetches the latest data.
           */
          caches.match(url).then(function(response) {
            console.log('cache found', response);
            if (response) {
              response.json().then(function updateFromCache(results) {
                // results.key = key;
                // results.label = label;
                // results.created = json.query.created;
                app.showHome(results);
              });
            }
          });
        }

        // Fetch the latest data.
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
          if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
              var results = JSON.parse(request.response);
              // results.key = key;
              // results.label = label;
              // results.created = response.query.created;
              app.showHome(results);
            }
          } else {
            // Return the initial weather forecast since no data is available.
            // app.updateForecastCard(initialWeatherForecast);
          }
        };
        request.open('GET', url, true);
        request.send();

    };

    app.getArticle = function(id) {
        var url = 'https://www.purepeople.com/mobile/v3/article/device/android/id/' + id;
//         var url = 'https://secure.webedia.fr/pxy.php?q=http://www.purepeople.com/mobile/v3/article/device/android/id/' + id;

        // Cache logic here
        if ('caches' in window) {
          /*
           * Check if the service worker has already cached this request
           * data. If the service worker has the data, then display the cached
           * data while the app fetches the latest data.
           */
          caches.match(url).then(function(response) {
            console.log('cache found', response);
            if (response) {
              response.json().then(function updateFromCache(results) {
                // results.key = key;
                // results.label = label;
                // results.created = json.query.created;
                app.showArticle(results);
              });
            }
          });
        }

        // Fetch the latest data.
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
          if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
              var results = JSON.parse(request.response);
              // results.key = key;
              // results.label = label;
              // results.created = response.query.created;
              app.showArticle(results);
            }
          } else {
            // Return the initial weather forecast since no data is available.
            // app.updateForecastCard(initialWeatherForecast);
          }
        };
        request.open('GET', url, true);
        request.send();

    };

  /************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify this codelab, we've used localStorage.
   *   localStorage is a synchronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   ************************************************************************/

  // TODO add startup code here
  app.getHome();


  // TODO add service worker code here
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

})();
