var placeOverlay = new kakao.maps.CustomOverlay({zIndex:1}),
    contentNode = document.createElement('div'),
    markers = [],
    currCategory = []; // 현재 선택된 카테고리를 배열로 초기화

// 지도 생성 및 설정
var mapContainer = document.getElementById('map'),
    mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 5
    };

var map = new kakao.maps.Map(mapContainer, mapOption);
var ps = new kakao.maps.services.Places(map);

kakao.maps.event.addListener(map, 'idle', searchPlaces);
contentNode.className = 'placeinfo_wrap';
addEventHandle(contentNode, 'mousedown', kakao.maps.event.preventMap);
addEventHandle(contentNode, 'touchstart', kakao.maps.event.preventMap);
placeOverlay.setContent(contentNode);
addCategoryClickEvent();

function addEventHandle(target, type, callback) {
    if (target.addEventListener) {
        target.addEventListener(type, callback);
    } else {
        target.attachEvent('on' + type, callback);
    }
}

function searchPlaces() {
    // 선택된 카테고리가 없을 경우
    if (currCategory.length === 0) {
        removeMarker(); // 마커 제거
        return; // 함수 종료
    }

    placeOverlay.setMap(null);
    removeMarker();

    currCategory.forEach(function(category) {
        ps.categorySearch(category, placesSearchCB, {useMapBounds: true});
    });
}

var allPlaces = []; // 모든 검색된 장소를 저장할 배열

function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        allPlaces = allPlaces.concat(data); // 검색된 장소를 배열에 추가
        displayPlaces(allPlaces); // 전체 장소 표시
    }
}

function displayPlaces(places) {
    removeMarker(); // 이전 마커 제거

    for (var i = 0; i < places.length; i++) {
        var marker = addMarker(new kakao.maps.LatLng(places[i].y, places[i].x), i);

        // 마커와 검색결과 항목을 클릭했을 때 장소정보를 표출하도록 클릭 이벤트를 등록합니다
        (function(marker, place) {
            kakao.maps.event.addListener(marker, 'click', function() {
                displayPlaceInfo(place);
            });
        })(marker, places[i]);
    }
}

function addMarker(position) {
    var marker = new kakao.maps.Marker({
        position: position,
        map: map
    });
    markers.push(marker);
    return marker;
}

function removeMarker() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function displayPlaceInfo(place) {
    var content = '<div class="placeinfo">' +
        '   <a class="title" href="' + place.place_url + '" target="_blank" title="' + place.place_name + '">' + place.place_name + '</a>';

    if (place.road_address_name) {
        content += '    <span title="' + place.road_address_name + '">' + place.road_address_name + '</span>' +
            '  <span class="jibun" title="' + place.address_name + '">(지번 : ' + place.address_name + ')</span>';
    } else {
        content += '    <span title="' + place.address_name + '">' + place.address_name + '</span>';
    }

    content += '    <span class="tel">' + place.phone + '</span>' +
        '</div>' +
        '<div class="after"></div>';

    contentNode.innerHTML = content;
    placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
    placeOverlay.setMap(map);
}

function addCategoryClickEvent() {
    var category = document.getElementById('category'),
        children = category.children;

    for (var i = 0; i < children.length; i++) {
        children[i].onclick = onClickCategory;
    }
}

function onClickCategory() {
    var id = this.id,
        className = this.className;

    placeOverlay.setMap(null);

    if (className === 'on') {
        currCategory = currCategory.filter(category => category !== id);
        changeCategoryClass();
        allPlaces = []; // 검색된 장소 초기화
        searchPlaces(); // 카테고리 업데이트 후 검색
    } else {
        currCategory.push(id);
        changeCategoryClass(this);
        searchPlaces(); // 카테고리 추가 후 검색
    }
}

function changeCategoryClass() {
    var category = document.getElementById('category'),
        children = category.children;

    for (var i = 0; i < children.length; i++) {
        children[i].className = '';
    }

    currCategory.forEach(function(id) {
        document.getElementById(id).className = 'on';
    });
}
document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById("toggleBtn");
    const sidebar = document.getElementById("sidebar");

    toggleBtn.addEventListener("click", function() {
        sidebar.classList.toggle("collapsed");
        toggleBtn.textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀"; // 버튼 텍스트 변경
    });
});
