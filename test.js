var placeOverlay = new kakao.maps.CustomOverlay({zIndex:1}),
    contentNode = document.createElement('div'),
    markers = [],
    currCategory = [],
    currentPosition; // 현재 위치를 저장할 변수

// OpenWeatherMap API 설정
const weatherApiKey = 'adb67de4a557753e101c9a33b531a4d6'; // 여기에 OpenWeatherMap API 키를 입력하세요.
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';

// 온도별 의상 추천 데이터 정의
const clothingRecommendations = [
    { minTemp: 30, clothing: "반팔 티셔츠, 반바지, 얇은 원피스" },
    { minTemp: 25, clothing: "얇은 셔츠, 반팔 티셔츠, 반바지 또는 면바지" },
    { minTemp: 20, clothing: "얇은 스웨터, 긴팔 셔츠, 청바지" },
    { minTemp: 15, clothing: "가디건, 니트, 얇은 재킷" },
    { minTemp: 10, clothing: "두꺼운 스웨터, 두꺼운 재킷, 코트" },
    { minTemp: 5, clothing: "패딩 점퍼, 두꺼운 코트, 목도리" },
    { minTemp: 0, clothing: "두꺼운 패딩, 털모자, 장갑" },
    { minTemp: -100, clothing: "방한복, 털부츠, 귀마개" } // -100°C 이하일 때
];

// 온도에 따른 의상 추천을 반환하는 함수
function getClothingRecommendation(temp) {
    for (const recommendation of clothingRecommendations) {
        if (temp >= recommendation.minTemp) {
            return recommendation.clothing;
        }
    }
    return "적절한 의상 정보가 없습니다."; // 기본 메시지
}

// 지도 생성 및 설정
var mapContainer = document.getElementById('map'),
    mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 5
    };

var map = new kakao.maps.Map(mapContainer, mapOption);
var ps = new kakao.maps.services.Places(map);

// 카테고리별 이미지 매핑
var categoryImages = {
    'AT4': 'a.png', // 주변 여행지
    'FD6': 'v.png', // 음식점
    'CE7': 'c.png', // 카페
    'AD5': 'd.png', // 숙소
    'PK6': 'e.png', // 주차장
    'HP8': 'r.png', // 병원
    'PM9': 'f.png'  // 약국
};

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
        removeMarker(); // 마커 제거
        return; // 함수 종료
    }

    placeOverlay.setMap(null);
    removeMarker();

    allPlaces = []; // 모든 장소 초기화

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

    // 현재 위치 기준으로 거리 계산
    places.forEach(function(place) {
        var placeLocation = new kakao.maps.LatLng(place.y, place.x);
        place.distance = getDistance(currentPosition, placeLocation); // 거리 추가
    });

    // 거리 기준으로 정렬
    places.sort(function(a, b) {
        return a.distance - b.distance;
    });

    // 상위 10개 장소만 표시
    var displayedPlaces = places.slice(0, 10);

    // 정렬된 장소 표시
    for (var i = 0; i < displayedPlaces.length; i++) {
        var marker = addMarker(new kakao.maps.LatLng(displayedPlaces[i].y, displayedPlaces[i].x), displayedPlaces[i].category_group_code); // 카테고리 코드 전달

        // 장소 정보를 표시하기 위해 클릭 이벤트 등록
        (function(marker, place) {
            kakao.maps.event.addListener(marker, 'click', function() {
                displayPlaceInfo(place);
            });
        })(marker, displayedPlaces[i]);
    }

    updateSidebar(displayedPlaces); // 사이드바 업데이트
}

function updateSidebar(places) {
    var sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = ''; // 기존 목록 초기화

    places.forEach(function(place) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + place.place_url + '" target="_blank">' + place.place_name + ' - ' + place.distance.toFixed(2) + 'm</a>'; // 거리 표시
        sidebar.appendChild(li);
    });

    // 현재 날씨 정보 표시
    if (currentPosition) {
        fetchWeather(currentPosition.getLat(), currentPosition.getLng());
    }
}

function addMarker(position, category) {
    var imageSrc = categoryImages[category] || 'default.png'; // 기본 아이콘 설정
    var imageSize = new kakao.maps.Size(24, 35); // 마커 이미지 크기
    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    var marker = new kakao.maps.Marker({
        position: position,
        image: markerImage, // 이미지 설정
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

// 거리 계산 함수 (미터 단위)
function getDistance(latlng1, latlng2) {
    var lat1 = latlng1.getLat();
    var lon1 = latlng1.getLng();
    var lat2 = latlng2.getLat();
    var lon2 = latlng2.getLng();

    var R = 6371e3; // 지구 반경 (미터)
    var φ1 = lat1 * Math.PI / 180; // 위도 1
    var φ2 = lat2 * Math.PI / 180; // 위도 2
    var Δφ = (lat2 - lat1) * Math.PI / 180; // 위도 차
    var Δλ = (lon2 - lon1) * Math.PI / 180; // 경도 차

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var distance = R * c; // 거리 계산
    return distance; // 미터 단위로 반환
}

// 현재 위치 
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude; // 위도
        var lon = position.coords.longitude; // 경도
        
        console.log("현재 위치:", lat, lon); // 현재 위치를 콘솔에 출력
        currentPosition = new kakao.maps.LatLng(lat, lon); // 위치 좌표 생성
        
        // 지도 중심좌표를 접속위치로 변경합니다
        map.setCenter(currentPosition);
        
        // 현재 위치 마커 생성
        var marker = new kakao.maps.Marker({
            position: currentPosition, // 위치 좌표
            map: map // 지도에 마커 추가
        });

        // 이미지 클릭 시 현재 위치로 이동
        document.getElementById("currentLocationImage").onclick = function() {
            map.setCenter(currentPosition); // 현재 위치로 지도 이동
        };

        // 현재 위치 기반 날씨 정보 가져오기
        fetchWeather(lat, lon);

    }, function(error) {
        console.error("현재 위치를 가져올 수 없습니다.", error);
    });
} else {
    // HTML5의 GeoLocation을 사용할 수 없을때 기본 위치 설정
    var locPosition = new kakao.maps.LatLng(33.450701, 126.570667); 
    map.setCenter(locPosition); // 기본 위치로 설정

    // 기본 위치 마커 생성
    var marker = new kakao.maps.Marker({
        position: locPosition, // 기본 위치 좌표
        map: map // 지도에 마커 추가
    });

    // 이미지 클릭 시 기본 위치로 이동
    document.getElementById("currentLocationImage").onclick = function() {
        map.setCenter(locPosition); // 기본 위치로 지도 이동
    };
}

// 날씨 정보 가져오기 함수
function fetchWeather(lat, lon) {
    const api = `${weatherApiUrl}?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&lang=kr&units=metric`;

    console.log("API 호출 URL:", api); // API 호출 URL을 콘솔에 출력

    fetch(api)
        .then(response => {
            console.log("API 응답 상태:", response.status); // 응답 상태를 콘솔에 출력
            return response.json();
        })
        .then(data => {
            console.log("날씨 데이터:", data); // 날씨 데이터를 콘솔에 출력
            const weatherInfo = document.getElementById("weather-info");
            const temperature = data.main.temp;
            const clothingSuggestion = getClothingRecommendation(temperature);

            weatherInfo.innerHTML = `
                <p>위치: ${data.name}</p>
                <p>날씨: ${data.weather[0].description}</p>
                <p>온도: ${temperature}°C</p>
                <p>추천 의상: ${clothingSuggestion}</p>
            `;
        })
        .catch(error => console.error("Error fetching weather data:", error));
}

function showError(error) {
    console.error("Geolocation error:", error);
}