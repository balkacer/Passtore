package com.passtoremobile.autofill

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import org.json.JSONObject

class PasstoreAutofillModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "PasstoreAutofill"

  @ReactMethod
  fun replaceIdentity(credential: ReadableMap, promise: Promise) {
    try {
      val json = readableMapToJsonObject(credential)
      AutofillIdentityStore.upsert(reactApplicationContext, json)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("E_AUTOFILL", e.message, e)
    }
  }

  @ReactMethod
  fun removeIdentity(credentialId: String, promise: Promise) {
    try {
      AutofillIdentityStore.remove(reactApplicationContext, credentialId)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("E_AUTOFILL", e.message, e)
    }
  }

  private fun readableMapToJsonObject(map: ReadableMap): JSONObject {
    val o = JSONObject()
    val it = map.keySetIterator()
    while (it.hasNextKey()) {
      val key = it.nextKey()
      when (map.getType(key)) {
        ReadableType.Null -> o.put(key, JSONObject.NULL)
        ReadableType.Boolean -> o.put(key, map.getBoolean(key))
        ReadableType.Number -> o.put(key, map.getDouble(key))
        ReadableType.String -> o.put(key, map.getString(key) ?: "")
        ReadableType.Map, ReadableType.Array -> {
          /* omit nested structures — payload is flat */
        }
      }
    }
    return o
  }
}
