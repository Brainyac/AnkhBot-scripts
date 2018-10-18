#!/usr/bin/env python
# coding: utf8

#---------------------------------------
#   Import Libraries
#---------------------------------------
import sys
import clr
import os
import codecs
import json
from collections import defaultdict
from collections import OrderedDict
clr.AddReference("IronPython.SQLite.dll")
clr.AddReference("IronPython.Modules.dll")
import time
import datetime

#---------------------------------------
#   [Required] Script Information
#---------------------------------------
ScriptName = "Overlay [Giveaway]"
Website = "http://www.brains-world.eu" 
Description = "Overlay for the integrated Giveaway"
Creator = "Brain"
Version = "2.0.0"
#---------------------------------------
#   Set Variables
#---------------------------------------
configFile = "GiveawayConfig.json"
settings = {}


def OpenReadMe():
    location = os.path.join(os.path.dirname(__file__), "Readme.txt")
    os.startfile(location)
    return

def BtnOpenOverlaysFolder():
    location = os.path.join(os.path.dirname(__file__), "Overlays")
    os.startfile(location)
    return

#---------------------------------------
#   [Required] Initialize Data / Load Only
#---------------------------------------
def Init():
    global settings, configFile
    path = os.path.dirname(__file__)

    themes = [x for x in os.listdir(os.path.join(path, "Overlays"))
    if os.path.isdir(os.path.join(path, "Overlays", x))]
    rewriteUIConfig(dictKey="overlayThemeName", newItems=themes, configFile=os.path.join(path, "UI_Config.json"))

    with codecs.open(os.path.join(path, configFile), encoding='utf-8-sig', mode='r') as file:
        settings = json.load(file, encoding='utf-8-sig')

    if len(settings.get("overlayThemeName", "")) != 0:
        settings["configFileLoaded"] = True

    Parent.Log("GAO", json.dumps(settings))
    PushData("initThemeData")
    return

def ReloadSettings(jsonData):
    Init()
    return

def Execute(data):
    return

def Tick():
    return

def PushData(eventName):
    global settings

    if eventName == "initThemeData":
        Parent.BroadcastWsEvent("EVENT_INIT_THEME", json.dumps({"themeName": settings["overlayThemeName"], "themeLanguage": settings["overlayLanguage"]}, ensure_ascii=False))

def rewriteUIConfig(dictKey, newItems, configFile=""):
    dictionary = OrderedDict()
    oldItems = []

    with codecs.open(configFile, encoding='utf-8-sig', mode='r') as file:
        dictionary = json.load(file, encoding='utf-8-sig', object_pairs_hook=OrderedDict)
        oldItems = dictionary[dictKey]["items"]
        dictionary[dictKey]["items"] = newItems

        if len(dictionary[dictKey]["items"]) > 0:
            dictionary[dictKey]["value"] = dictionary[dictKey]["value"] if dictionary[dictKey]["value"] in dictionary[dictKey]["items"] else dictionary[dictKey]["items"][0]

        if dictionary != OrderedDict() and sorted(oldItems) != sorted(newItems):
            try:
                with codecs.open(configFile, encoding='utf-8-sig', mode='w') as file:
                    json.dump(dictionary, file, encoding='utf-8-sig', indent=4, sort_keys=False)
            except:
                return

dummyAmount = 10
dummyName = "Wellbrained"

def createDummyTemplate(number):
    return {
        "userid": dummyName + str(number),
        "name": dummyName + str(number),
        "tickets": number
    }

def TestGiveaway():
    global threading
    # threading.Thread(target=RunTest, args=()).start()
    RunTest()

def RunTest():
    global time, json, os
    jsonPath = os.path.join(os.path.dirname(__file__), "Data\\" + "data_test.json")
    with open(jsonPath, "r") as f:
        jsonContent = json.load(f)

    Parent.BroadcastWsEvent("EVENT_GIVEAWAY_START", json.dumps(jsonContent["start"]["data"]))

    Parent.BroadcastWsEvent("EVENT_GIVEAWAY_ENTER", json.dumps(jsonContent["vote1"]["data"]))
    Parent.BroadcastWsEvent("EVENT_GIVEAWAY_UPDATE", json.dumps(jsonContent["vote2"]["data"]))
    Parent.BroadcastWsEvent("EVENT_GIVEAWAY_ENTER", json.dumps(jsonContent["vote3"]["data"]))

    # Erstellen der Dummy-Einträge
    for i in range(dummyAmount):
        thisTemplate = createDummyTemplate(i)
        Parent.BroadcastWsEvent("EVENT_GIVEAWAY_ENTER", json.dumps(thisTemplate))