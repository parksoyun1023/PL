var placeOverlay = new kakao.maps.CustomOverlay({ zIndex: 1 }),
    contentNode = document.createElement('div'),
    markers = [],
    currCategory = [];

// 카테고리별 이미지 매핑
var categoryImages = {
    'AT4': 'a.png',
    'FD6': 'v.png',
    'CE7': 'c.png',
    'AD5': 'd.png',
    'PK6': 'e.png',
    'HP8': 'r.png',
    'PM9': 'f.png'
};

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
    if (currCategory.length === 0) {
        removeMarker();
        return;
    }

    placeOverlay.setMap(null);
    removeMarker();

    currCategory.forEach(function (category) {
        ps.categorySearch(category, placesSearchCB, { useMapBounds: true });
    });
}

var allPlaces = [];

function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        allPlaces = allPlaces.concat(data);
        displayPlaces(allPlaces);
    }
}

function displayPlaces(places) {
    removeMarker();
    clearSidebar(); // 사이드바 초기화

    for (var i = 0; i < places.length; i++) {
        var marker = addMarker(new kakao.maps.LatLng(places[i].y, places[i].x), places[i].category_group_code);

        // 사이드바에 장소 추가
        addPlaceToSidebar(places[i]);

        (function (marker, place) {
            kakao.maps.event.addListener(marker, 'click', function () {
                displayPlaceInfo(place);
            });
        })(marker, places[i]);
    }
}

function addMarker(position, category) {
    var imageSrc = categoryImages[category] || 'default.png';
    var imageSize = new kakao.maps.Size(24, 35);
    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    var marker = new kakao.maps.Marker({
        position: position,
        image: markerImage,
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
        '<a class="title" href="' + place.place_url + '" target="_blank" title="' + place.place_name + '">' + place.place_name + '</a>';

    if (place.road_address_name) {
        content += '<span title="' + place.road_address_name + '">' + place.road_address_name + '</span>' +
            '<span class="jibun" title="' + place.address_name + '">(지번 : ' + place.address_name + ')</span>';
    } else {
        content += '<span title="' + place.address_name + '">' + place.address_name + '</span>';
    }

    content += '<span class="tel">' + (place.phone || '전화번호 없음') + '</span>' +
        '</div>' +
        '<div class="after"></div>';

    // 거리 정보를 계산하여 추가
    if (userLocation) {
        var distance = calculateDistance(userLocation.getLat(), userLocation.getLng(), place.y, place.x);
        content += '<div class="distance">거리: ' + distance.toFixed(2) + ' km</div>';
    }

    contentNode.innerHTML = content;
    placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
    placeOverlay.setMap(map);
}

// 두 위치 간 거리 계산 함수
function calculateDistance(lat1, lng1, lat2, lng2) {
    var R = 6371; // 지구의 반지름 (킬로미터)
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
        allPlaces = [];
        searchPlaces();
    } else {
        currCategory.push(id);
        changeCategoryClass(this);
        searchPlaces();
    }
}

function changeCategoryClass() {
    var category = document.getElementById('category'),
        children = category.children;

    for (var i = 0; i < children.length; i++) {
        children[i].className = '';
    }

    currCategory.forEach(function (id) {
        document.getElementById(id).className = 'on';
    });
}

// 사이드바에 장소 추가
function addPlaceToSidebar(place) {
    var sidebar = document.getElementById('sidebar');
    var li = document.createElement('li');
    li.innerHTML = '<a href="' + place.place_url + '" target="_blank" title="' + place.place_name + '">' + place.place_name + '</a>'; // URL 링크 추가
    
    // 거리 계산
    if (userLocation) {
        var distance = calculateDistance(userLocation.getLat(), userLocation.getLng(), place.y, place.x);
        li.innerHTML += ' <span class="distance">(' + distance.toFixed(2) + ' km)</span>';
    }

    sidebar.appendChild(li);
}

// 사이드바 초기화
function clearSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = ''; // 사이드바 내용 초기화
}

// 현재 위치 
var userLocation; 
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;

        userLocation = new kakao.maps.LatLng(lat, lon);
        map.setCenter(userLocation);

        var marker = new kakao.maps.Marker({
            position: userLocation,
            map: map
        });

        document.getElementById("currentLocationImage").onclick = function () {
            map.setCenter(userLocation);
        };

    }, function (error) {
        console.error("현재 위치를 가져올 수 없습니다.", error);
    });
} else {
    var locPosition = new kakao.maps.LatLng(33.450701, 126.570667);
    map.setCenter(locPosition);

    var marker = new kakao.maps.Marker({
        position: locPosition,
        map: map
    });

    document.getElementById("currentLocationImage").onclick = function () {
        map.setCenter(locPosition);
    };
}
