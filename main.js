const roomId = "minimal-lib-jitsi-meet-example-room";
const domain = "meet.jit.si";

const initOptions = {
  disableAudioLevels: true,
};

const conferenceOptions = {
  p2p: {
    enabled: false,
  },
};

const connectionOptions = {
  serviceUrl: `https://${domain}/http-bind?room=${roomId}`,
  hosts: {
    domain: domain,
    muc: `conference.${domain}`,
    focus: `focus.${domain}`,
  },
  clientNode: "http://jitsi.org/jitsimeet",
};

let connection = null;
let isJoined = false;
let room = null;
window.app = {};

let localTracks = [];
const remoteTracks = {};

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
  localTracks = tracks;
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      (audioLevel) => console.log(`Audio Level local: ${audioLevel}`)
    );
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
      () => console.log("local track muted")
    );
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
      () => console.log("local track stoped")
    );
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      (deviceId) =>
        console.log(`track audio output device was changed to ${deviceId}`)
    );
    if (localTracks[i].getType() === "video") {
      $(".streams").append(`<video autoplay='1' id='localVideo${i}' />`);
      localTracks[i].attach($(`#localVideo${i}`)[0]);
    } else {
      $(".streams").append(
        `<audio autoplay='1' muted='true' id='localAudio${i}' />`
      );
      localTracks[i].attach($(`#localAudio${i}`)[0]);
    }
    if (isJoined) {
      room.addTrack(localTracks[i]);
    }
  }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
  console.log("onRemoteTrack");

  if (track.isLocal()) {
    return;
  }
  const participant = track.getParticipantId();

  if (!remoteTracks[participant]) {
    remoteTracks[participant] = [];
  }
  const idx = remoteTracks[participant].push(track);

  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
    (audioLevel) => console.log(`Audio Level remote: ${audioLevel}`)
  );
  track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () =>
    console.log("remote track muted")
  );
  track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () =>
    console.log("remote track stoped")
  );
  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
    (deviceId) =>
      console.log(`track audio output device was changed to ${deviceId}`)
  );
  const id = participant + track.getType() + idx;

  if (track.getType() === "video") {
    $(".streams").append(
      `<video autoplay='1' id='${participant}video${idx}' />`
    );
  } else {
    $(".streams").append(
      `<audio autoplay='1' id='${participant}audio${idx}' />`
    );
  }
  track.attach($(`#${id}`)[0]);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
  console.log("conference joined!");
  isJoined = true;
  for (let i = 0; i < localTracks.length; i++) {
    room.addTrack(localTracks[i]);
  }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
  console.log("user left");
  if (!remoteTracks[id]) {
    return;
  }
  const tracks = remoteTracks[id];

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].detach($(`#${id}${tracks[i].getType()}`));
  }
}

function setDisplayName() {
  if (!sessionStorage.getItem("data")) {
    sessionStorage.setItem(
      "data",
      JSON.stringify({
        id: `local-jitsi-12512412`,
        name: "Vladislav",
      })
    );
  }

  // room.setDisplayName(sessionStorage.getItem("data"));

  const parsedStorageData = JSON.parse(sessionStorage.getItem("data"));
  $(".localUserInfoId span").text(parsedStorageData.id);
  $(".localUserInfoName span").text(parsedStorageData.name);
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
  console.log("connection success");
  room = window.app.room = connection.initJitsiConference(
    roomId,
    conferenceOptions
  );
  room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
  room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track) => {
    console.log(`track removed!!!${track}`);
  });
  room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
  room.on(JitsiMeetJS.events.conference.USER_JOINED, (id) => {
    console.log("user join");
    remoteTracks[id] = [];
  });
  room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
  room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track) => {
    console.log(`${track.getType()} - ${track.isMuted()}`);
  });
  room.on(
    JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
    (userID, displayName) => console.log(`${userID} - ${displayName}`)
  );
  room.on(
    JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
    (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`)
  );
  room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () =>
    console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`)
  );
  console.log("Room join process...");
  room.join();
  room.setReceiverVideoConstraint(720);
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
  console.log("Connection Failed!");
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
  console.log("current devices", devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
  console.log("disconnect!");
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess
  );
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed
  );
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect
  );
}

/**
 *
 */
function unload() {
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].dispose();
  }
  room.leave();
  connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() {
  // eslint-disable-line no-unused-vars
  isVideo = !isVideo;
  if (localTracks[1]) {
    localTracks[1].dispose();
    localTracks.pop();
  }
  JitsiMeetJS.createLocalTracks({
    devices: [isVideo ? "video" : "desktop"],
  })
    .then((tracks) => {
      localTracks.push(tracks[0]);
      localTracks[1].addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log("local track muted")
      );
      localTracks[1].addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log("local track stoped")
      );
      localTracks[1].attach($("#localVideo1")[0]);
      room.addTrack(localTracks[1]);
    })
    .catch((error) => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) {
  // eslint-disable-line no-unused-vars
  JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

$(window).bind("beforeunload", unload);
$(window).bind("unload", unload);

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.INFO);

JitsiMeetJS.init(initOptions);

connection = window.app.connection = new JitsiMeetJS.JitsiConnection(
  null,
  null,
  connectionOptions
);

connection.addEventListener(
  JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
  onConnectionSuccess
);
connection.addEventListener(
  JitsiMeetJS.events.connection.CONNECTION_FAILED,
  onConnectionFailed
);
connection.addEventListener(
  JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
  disconnect
);

JitsiMeetJS.mediaDevices.addEventListener(
  JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
  onDeviceListChanged
);

connection.connect();

JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] })
  .then(onLocalTracks)
  .catch((error) => {
    throw error;
  });

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable("output")) {
  JitsiMeetJS.mediaDevices.enumerateDevices((devices) => {
    const audioOutputDevices = devices.filter((d) => d.kind === "audiooutput");

    if (audioOutputDevices.length > 1) {
      $("#audioOutputSelect").html(
        audioOutputDevices
          .map((d) => `<option value="${d.deviceId}">${d.label}</option>`)
          .join("\n")
      );

      $("#audioOutputSelectWrapper").show();
    }
  });
}
