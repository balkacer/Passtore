package com.passtoremobile.autofill

import android.app.assist.AssistStructure
import android.app.assist.AssistStructure.ViewNode
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.Dataset
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import android.view.View
import android.view.autofill.AutofillValue
import org.json.JSONArray
import org.json.JSONObject

/**
 * Android Autofill — fills username from local vault metadata when the web domain matches.
 * Password remains empty (unlock/copy inside Passtore).
 */
class PasstoreAutofillService : AutofillService() {

  override fun onFillRequest(
    request: FillRequest,
    cancellationSignal: CancellationSignal,
    callback: FillCallback,
  ) {
    val structure =
      request.fillContexts.lastOrNull()?.structure
        ?: run {
          callback.onSuccess(null)
          return
        }

    val webHost = extractWebHost(structure)?.lowercase()
    if (webHost.isNullOrEmpty()) {
      callback.onSuccess(null)
      return
    }

    val identities = AutofillIdentityStore.load(applicationContext)
    val match = findBestMatchingIdentity(identities, webHost) ?: run {
      callback.onSuccess(null)
      return
    }

    val usernameAutofillId = findAutofillIdForHint(structure, View.AUTOFILL_HINT_USERNAME)
      ?: run {
        callback.onSuccess(null)
        return
      }

    val datasetBuilder = Dataset.Builder()

    val username = match.optString("loginUsername", "")
    datasetBuilder.setValue(usernameAutofillId, AutofillValue.forText(username))

    val passwordId = findAutofillIdForHint(structure, View.AUTOFILL_HINT_PASSWORD)
    if (passwordId != null) {
      datasetBuilder.setValue(passwordId, AutofillValue.forText(""))
    }

    val response =
      FillResponse.Builder()
        .addDataset(datasetBuilder.build())
        .build()
    callback.onSuccess(response)
  }

  override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
    callback.onFailure("save_not_implemented")
  }

  private fun extractWebHost(structure: AssistStructure): String? {
    for (i in 0 until structure.windowNodeCount) {
      val root = structure.getWindowNodeAt(i).rootViewNode
      findWebDomainInSubtree(root)?.let {
        return try {
          android.net.Uri.parse("https://$it").host ?: it
        } catch (_: Exception) {
          it
        }
      }
    }
    return null
  }

  private fun findWebDomainInSubtree(node: ViewNode): String? {
    val wd = node.webDomain
    if (!wd.isNullOrEmpty()) {
      return wd
    }
    for (i in 0 until node.childCount) {
      findWebDomainInSubtree(node.getChildAt(i))?.let {
        return it
      }
    }
    return null
  }

  private fun findAutofillIdForHint(structure: AssistStructure, hint: String): android.view.autofill.AutofillId? {
    for (i in 0 until structure.windowNodeCount) {
      val root = structure.getWindowNodeAt(i).rootViewNode
      findNodeWithHint(root, hint)?.let {
        return it.autofillId
      }
    }
    return null
  }

  private fun findNodeWithHint(node: ViewNode, hint: String): ViewNode? {
    val hints = node.autofillHints
    if (hints != null && hints.contains(hint)) {
      return node
    }
    for (i in 0 until node.childCount) {
      findNodeWithHint(node.getChildAt(i), hint)?.let {
        return it
      }
    }
    return null
  }

  private fun hostFromIdentity(json: JSONObject): String? {
    val norm = json.optString("normalizedOrigin", "")
    if (norm.isNotEmpty()) {
      return try {
        android.net.Uri.parse(norm).host?.lowercase()
      } catch (_: Exception) {
        null
      }
    }
    val url = json.optString("url", "")
    if (url.isNotEmpty()) {
      return try {
        android.net.Uri.parse(url).host?.lowercase()
      } catch (_: Exception) {
        null
      }
    }
    return null
  }

  private fun hostsMatch(requestHost: String, storedHost: String): Boolean {
    val a = requestHost.lowercase()
    val b = storedHost.lowercase()
    if (a == b) {
      return true
    }
    return a.endsWith(".$b") || b.endsWith(".$a")
  }

  private fun findBestMatchingIdentity(identities: JSONArray, webHost: String): JSONObject? {
    var exact: JSONObject? = null
    var partial: JSONObject? = null
    val wh = webHost.lowercase()
    for (i in 0 until identities.length()) {
      val o = identities.getJSONObject(i)
      val h = hostFromIdentity(o) ?: continue
      val hl = h.lowercase()
      if (hl == wh) {
        exact = o
        break
      }
      if (hostsMatch(wh, hl)) {
        partial = o
      }
    }
    return exact ?: partial
  }
}
