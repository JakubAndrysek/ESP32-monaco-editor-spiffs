#include <Arduino.h>
#include <WiFi.h>
#include <FS.h>
#include <SPIFFS.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

const char *ssid = "SSID";
const char *password = "PASSWORD";

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);

WebSocketsServer webSocket(8765); // WebSocket on port 81

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("An error has occurred while mounting SPIFFS");
    return;
  }
  Serial.println("SPIFFS mounted");

  // Start WebSocket server and callbacks
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  String message = String((char *)payload);
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);

  String action = doc["action"];

  if (action == "load") {
    String filename = doc["filename"].as<String>();
    Serial.println("Opening file: " + filename);
    if (SPIFFS.exists(filename)) {
      File file = SPIFFS.open(filename, FILE_READ);
      String content = file.readString();
      DynamicJsonDocument response(1024);
      response["action"] = "load";
      response["content"] = content;
      String jsonResponse;
      serializeJson(response, jsonResponse);
      Serial.println(jsonResponse);
      webSocket.sendTXT(num, jsonResponse);
      file.close();
    } else {
      String error = "Error: File not found";
      Serial.println(error);
      webSocket.sendTXT(num, error);
    }
  }

  else if (action == "save") {
    String tsContent = doc["tsContent"].as<String>();
    String jsContent = doc["jsContent"].as<String>();
    String fileName = doc["fileName"].as<String>();

    File tsFile = SPIFFS.open(fileName, FILE_WRITE);
    tsFile.print(tsContent);
    tsFile.close();

    // File jsFile = SPIFFS.open("/example.js", FILE_WRITE);
    // jsFile.print(jsContent);
    // jsFile.close();

    // webSocket.sendTXT(num, "Files saved");
  }

  else if (action == "list") {
    DynamicJsonDocument response(2048);
    response["action"] = "list";
    JsonArray filesArray = response.createNestedArray("files");
    File root = SPIFFS.open("/");
    File file = root.openNextFile();
    while (file) {
      filesArray.add(file.path());
      file = root.openNextFile();
    }
    String jsonResponse;
    serializeJson(response, jsonResponse);
    Serial.println(jsonResponse);
    webSocket.sendTXT(num, jsonResponse);
  }
}
