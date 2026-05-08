package com.passtoremobile.autofill

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Non-secret autofill index mirrored from JS when vault rows change.
 * Read by [PasstoreAutofillService] on fill requests.
 */
object AutofillIdentityStore {
  private const val PREFS = "passtore_autofill_identities"
  private const val KEY_JSON = "identities_json"

  fun load(context: Context): JSONArray {
    val sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = sp.getString(KEY_JSON, "[]") ?: "[]"
    return try {
      JSONArray(raw)
    } catch (_: Exception) {
      JSONArray()
    }
  }

  fun upsert(context: Context, credential: JSONObject) {
    val arr = load(context)
    val id = credential.getString("id")
    val next = JSONArray()
    var replaced = false
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      if (o.getString("id") == id) {
        next.put(credential)
        replaced = true
      } else {
        next.put(o)
      }
    }
    if (!replaced) {
      next.put(credential)
    }
    save(context, next)
  }

  fun remove(context: Context, credentialId: String) {
    val arr = load(context)
    val next = JSONArray()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      if (o.getString("id") != credentialId) {
        next.put(o)
      }
    }
    save(context, next)
  }

  private fun save(context: Context, arr: JSONArray) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_JSON, arr.toString())
      .apply()
  }
}
