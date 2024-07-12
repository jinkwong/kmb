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
  // 具體實現省略，假設與原始版本相同
}
