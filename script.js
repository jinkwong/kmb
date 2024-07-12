// 選取元素
const elements = {
  routeSearchedList: document.querySelector(".routeSearchedList"),
  searchbox: document.querySelector("#routeInput"),
  searchBtn: document.querySelector("#searchBtn"),
  stopID_name: {},
  stopSearchedList: document.querySelector(".stopList"),
  alertContainer: document.querySelector(".alertContainer"),
  suggestionsBox: document.querySelector("#suggestions"),
  historyList: document.querySelector("#historyList"),
  allRoutes: []
};

// 獲取所有停靠站點的名稱
window.addEventListener("load", async () => {
  try {
    const [stopNamesResponse, routeNamesResponse] = await Promise.all([
      axios("https://data.etabus.gov.hk/v1/transport/kmb/stop"),
      axios("https://data.etabus.gov.hk/v1/transport/kmb/route/")
    ]);

    stopNamesResponse.data.data.forEach(stop => {
      elements.stopID_name[stop.stop] = stop.name_tc;
    });

    elements.allRoutes = routeNamesResponse.data.data.map(route => route.route);
  } catch (error) {
    console.error(error);
  }

  loadHistory();
});

// 顯示提醒消息
function showAlert(message) {
  elements.alertContainer.innerHTML = `<div class="alertMessage">${message}</div>`;
}

// 查詢路線
async function searchRoute() {
  const { routeSearchedList, stopSearchedList, alertContainer, searchbox, stopID_name } = elements;

  routeSearchedList.innerHTML = "";
  stopSearchedList.innerHTML = "";
  alertContainer.innerHTML = "";

  try {
    const response = await axios("https://data.etabus.gov.hk/v1/transport/kmb/route/");
    const routes = response.data.data;
    const routeChecked = routes.filter(route => route.route === searchbox.value.toUpperCase());

    if (routeChecked.length === 0) {
      showAlert("未找到該路線，請檢查輸入是否正確。");
      return;
    }

    saveHistory(searchbox.value.toUpperCase());

    routeChecked.forEach((route, i) => {
      const routeSearched = document.createElement("button");
      routeSearched.id = `routeNumber-${i}`;
      routeSearched.innerHTML = `${route.orig_tc} -> ${route.dest_tc}`;
      routeSearchedList.appendChild(routeSearched);

      routeSearched.addEventListener("click", () => displayStops(route, i));
    });
  } catch (error) {
    console.error(error);
  }
}

// 顯示停靠站點
async function displayStops(route, index) {
  const { stopSearchedList, stopID_name } = elements;
  stopSearchedList.innerHTML = "";

  document.querySelectorAll('.routeSearchedList button').forEach(button => {
    button.classList.remove('active');
  });

  document.getElementById(`routeNumber-${index}`).classList.add('active');

  const routeboundConverted = route.bound === "O" ? "outbound" : "inbound";

  try {
    const stopResponse = await axios(
      `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/${routeboundConverted}/${route.service_type}`
    );

    stopResponse.data.data.forEach(stopInfo => {
      const stopName = stopID_name[stopInfo.stop];
      if (stopName) {
        const stopContainer = document.createElement("div");
        stopContainer.className = "stopContainer";

        const stopCreate = document.createElement("div");
        stopCreate.className = "stopNumber";
        stopCreate.innerHTML = stopName;
        stopContainer.appendChild(stopCreate);

        const etaList = document.createElement("div");
        etaList.className = "etaList";
        stopContainer.appendChild(etaList);

        stopSearchedList.appendChild(stopContainer);

        stopCreate.addEventListener("mouseover", () => displayETA(stopInfo.stop, route.route, etaList));
        stopCreate.addEventListener("mouseout", () => {
          etaList.style.display = 'none';
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
}

// 顯示 ETA
async function displayETA(stopId, route, etaList) {
  etaList.innerHTML = "";

  try {
    const etaResponse = await axios(
      `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`
    );

    etaResponse.data.data
      .filter(eta => eta.route === route)
      .forEach(eta => {
        const etaItem = document.createElement("div");
        etaItem.className = "etaItem";
        etaItem.innerHTML = `
          <span>巴士路線 : ${eta.route}</span>
          <span>預計到站時間: ${new Date(eta.eta).toLocaleTimeString()}</span>
        `;
        etaList.appendChild(etaItem);
      });

    etaList.style.display = 'block';
  } catch (error) {
    console.error(error);
  }
}

// 自動完成建議
elements.searchbox.addEventListener("input", () => {
  const input = elements.searchbox.value.toUpperCase();
  elements.suggestionsBox.innerHTML = "";
  if (input) {
    const suggestions = elements.allRoutes.filter(route => route.startsWith(input));
    suggestions.forEach(suggestion => {
      const suggestionItem = document.createElement("div");
      suggestionItem.className = "suggestion-item";
      suggestionItem.innerHTML = suggestion;
      suggestionItem.addEventListener("click", () => {
        elements.searchbox.value = suggestion;
        elements.suggestionsBox.innerHTML = "";
      });
      elements.suggestionsBox.appendChild(suggestionItem);
    });
  }
});

// 保存查詢記錄
function saveHistory(route) {
  let history = JSON.parse(localStorage.getItem('routeHistory')) || [];
  if (!history.includes(route)) {
    history.push(route);
    localStorage.setItem('routeHistory', JSON.stringify(history));
  }
  loadHistory();
}

// 加載查詢記錄
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('routeHistory')) || [];
  elements.historyList.innerHTML = "";
  history.forEach(route => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.innerHTML = route;
    historyItem.addEventListener("click", () => {
      elements.searchbox.value = route;
      searchRoute();
    });
    elements.historyList.appendChild(historyItem);
  });
}

// 為查詢按鈕添加事件監聽
elements.searchBtn.addEventListener("click", searchRoute);

// 為輸入框添加鍵盤事件監聽
elements.searchbox.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    searchRoute();
  }
});

