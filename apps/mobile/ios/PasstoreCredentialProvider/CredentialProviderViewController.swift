import AuthenticationServices
import UIKit

/// App Group must match `PasstoreMobile.entitlements` and the App Groups capability in Apple Developer.
private let kAppGroupSuiteName = "group.org.reactjs.native.example.PasstoreMobile"
private let kDefaultsKey = "PasstoreAutofillIdentitiesV1"

private struct IndexedCredential {
  let id: String
  let user: String
  let host: String
}

final class CredentialProviderViewController: ASCredentialProviderViewController, UITableViewDelegate, UITableViewDataSource {

  private let tableView = UITableView(frame: .zero, style: .insetGrouped)
  private var rows: [IndexedCredential] = []
  private var serviceIdentifiers: [ASCredentialServiceIdentifier] = []

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground

    let cancel = UIButton(type: .system)
    cancel.setTitle(NSLocalizedString("Cancelar", comment: ""), for: .normal)
    cancel.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
    cancel.translatesAutoresizingMaskIntoConstraints = false
    cancel.accessibilityIdentifier = "passtore.autofill.cancel"

    tableView.translatesAutoresizingMaskIntoConstraints = false
    tableView.delegate = self
    tableView.dataSource = self
    tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
    view.addSubview(cancel)
    view.addSubview(tableView)
    NSLayoutConstraint.activate([
      cancel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
      cancel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
      tableView.topAnchor.constraint(equalTo: cancel.bottomAnchor, constant: 8),
      tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])
  }

  override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
    self.serviceIdentifiers = serviceIdentifiers
    reloadRows()
    tableView.reloadData()
  }

  override func prepareInterfaceToExtension(for credentialIdentity: ASPasswordCredentialIdentity) {
    let credential = ASPasswordCredential(user: credentialIdentity.user, password: "")
    extensionContext.completeRequest(withSelectedCredential: credential, completionHandler: nil)
  }

  override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) -> ASPasswordCredential? {
    nil
  }

  @objc private func cancelTapped() {
    extensionContext.cancelRequest(
      withError: NSError(
        domain: ASExtensionErrorDomain,
        code: ASExtensionError.userCanceled.rawValue,
        userInfo: nil,
      ),
    )
  }

  private func reloadRows() {
    let suite = UserDefaults(suiteName: kAppGroupSuiteName)
    guard let dict = suite?.dictionary(forKey: kDefaultsKey), !dict.isEmpty else {
      rows = []
      return
    }

    var collected: [IndexedCredential] = []
    for (key, val) in dict {
      guard let keyStr = key as? String else { continue }
      guard let raw = val as? [String: Any] else { continue }
      guard let user = raw["loginUsername"] as? String else { continue }
      let host = hostFromCredentialPayload(raw) ?? ""
      let id = raw["id"] as? String ?? keyStr
      collected.append(IndexedCredential(id: id, user: user, host: host.lowercased()))
    }

    let hints = serviceIdentifiers.compactMap { sid -> String? in
      guard sid.type == .domain else { return nil }
      return sid.identifier.lowercased()
    }

    if hints.isEmpty {
      rows = collected.sorted { $0.user.localizedCaseInsensitiveCompare($1.user) == .orderedAscending }
      return
    }

    rows = collected.filter { item in
      hints.contains { hint in
        item.host == hint || item.host.hasSuffix("." + hint) || hint.hasSuffix("." + item.host)
      }
    }
    .sorted { $0.user.localizedCaseInsensitiveCompare($1.user) == .orderedAscending }
  }

  private func hostFromCredentialPayload(_ raw: [String: Any]) -> String? {
    if let norm = raw["normalizedOrigin"] as? String, !norm.isEmpty {
      return URL(string: norm)?.host?.lowercased()
    }
    if let urlStr = raw["url"] as? String, !urlStr.isEmpty {
      return URL(string: urlStr)?.host?.lowercased()
    }
    return nil
  }

  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    max(rows.count, 1)
  }

  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
    if rows.isEmpty {
      cell.textLabel?.text =
        "Sin cuentas para este sitio. Añade credenciales en Passtore."
      cell.textLabel?.numberOfLines = 0
      cell.selectionStyle = .none
      return cell
    }
    cell.textLabel?.numberOfLines = 1
    cell.selectionStyle = .default
    let row = rows[indexPath.row]
    cell.textLabel?.text = "\(row.user) — \(row.host)"
    return cell
  }

  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    tableView.deselectRow(at: indexPath, animated: true)
    guard !rows.isEmpty else { return }
    let row = rows[indexPath.row]
    let credential = ASPasswordCredential(user: row.user, password: "")
    extensionContext.completeRequest(withSelectedCredential: credential, completionHandler: nil)
  }
}
