const mqtt = require('mqtt');
const { nanoid } = require("nanoid");

let local_mqtt_host = '127.0.0.1';
let localmqtt = null;

let gcs_mqtt_host = '192.168.52.150';
let gcs_mqtt = null;
let gcs_mqtt_message = '';

let sub_pan_motor_position_topic = '/Ant_Tracker/Motor_Pan';
let sub_tilt_motor_position_topic = '/Ant_Tracker/Motor_Tilt';

let motor_control_topic = '/Ant_Tracker/Control';


//------------- gcs mqtt connect ------------------
function gcs_mqtt_connect(host) {
    let connectOptions = {
        host: host,
        port: 1883,
        protocol: "mqtt",
        keepalive: 10,
        clientId: 'sitl_' + nanoid(15),
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 2000,
        rejectUnauthorized: false
    }

    gcs_mqtt = mqtt.connect(connectOptions);

    gcs_mqtt.on('connect', function () {
        gcs_mqtt.subscribe(motor_control_topic + '/#', () => {
            console.log('[gcs] gcs_mqtt subscribed -> ', motor_control_topic);
        });
    });

    gcs_mqtt.on('message', function (topic, message) {
        // console.log('[gcs] topic, message => ', topic, message);

        if (topic === motor_control_topic) {
            try {
                localmqtt.publish(motor_control_topic, message.toString(), () => {
                    // console.log('send motor control message: ', motor_control_topic, message.toString());
                });
            } catch {
            }
        }
    });

    gcs_mqtt.on('error', function (err) {
        console.log('[tilt] sitl mqtt connect error ' + err.message);
        gcs_mqtt = null;
        setTimeout(gcs_mqtt_connect, 1000, gcs_mqtt_host);
    });
}
//---------------------------------------------------

//------------- local mqtt connect ------------------
function local_mqtt_connect(host) {
    let connectOptions = {
        host: host,
        port: 1883,
        protocol: "mqtt",
        keepalive: 10,
        clientId: 'local_' + nanoid(15),
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 2000,
        rejectUnauthorized: false
    }

    localmqtt = mqtt.connect(connectOptions);

    localmqtt.on('connect', function () {
        localmqtt.subscribe(sub_pan_motor_position_topic + '/#', () => {
            console.log('[pan] pan status subscribed -> ', sub_pan_motor_position_topic);
        });
        localmqtt.subscribe(sub_tilt_motor_position_topic + '/#', () => {
            console.log('[tilt] tilt status subscribed -> ', sub_tilt_motor_position_topic);
        });
    });

    localmqtt.on('message', function (topic, message) {
        // console.log('[motor] topic, message => ', topic, message);
        if (topic === sub_pan_motor_position_topic) {
            try {
                gcs_mqtt.publish(sub_pan_motor_position_topic, message.toString(), () => {
                    // console.log('send target drone data: ', pub_drone_data_topic, message);
                });
            } catch {
            }
        } else if(topic === sub_tilt_motor_position_topic){
            try {
                gcs_mqtt.publish(sub_tilt_motor_position_topic, message.toString(), () => {
                    // console.log('send target drone data: ', pub_drone_data_topic, message);
                });
            } catch {
            }
        }

    });

    localmqtt.on('error', function (err) {
        console.log('[tilt] local mqtt connect error ' + err.message);
        localmqtt = null;
        setTimeout(local_mqtt_connect, 1000, local_mqtt_host);
    });
}
//---------------------------------------------------

local_mqtt_connect(local_mqtt_host);
gcs_mqtt_connect(gcs_mqtt_host);
