#import "PasstoreAutofill.h"
#import <AuthenticationServices/AuthenticationServices.h>

static NSString *const kDefaultsKey = @"PasstoreAutofillIdentitiesV1";
/** Same App Group as `PasstoreMobile.entitlements` / Credential Provider extension (D2). */
static NSString *const kAppGroupSuiteName = @"group.org.reactjs.native.example.PasstoreMobile";

@implementation PasstoreAutofill

RCT_EXPORT_MODULE();

static NSUserDefaults *suiteDefaults(void)
{
  return [[NSUserDefaults alloc] initWithSuiteName:kAppGroupSuiteName];
}

static void migrateLegacyIdentitiesIfNeeded(void)
{
  NSUserDefaults *suite = suiteDefaults();
  NSDictionary *existing = [suite dictionaryForKey:kDefaultsKey];
  if (existing.count > 0) {
    return;
  }
  NSDictionary *legacy = [[NSUserDefaults standardUserDefaults] dictionaryForKey:kDefaultsKey];
  if (legacy.count > 0) {
    [suite setObject:legacy forKey:kDefaultsKey];
  }
}

static NSDictionary *storedIdentities(void)
{
  migrateLegacyIdentitiesIfNeeded();
  NSDictionary *d = [suiteDefaults() dictionaryForKey:kDefaultsKey];
  return d ?: @{};
}

static void persistIdentity(NSDictionary *credential)
{
  migrateLegacyIdentitiesIfNeeded();
  NSString *cid = credential[@"id"];
  if (!cid.length) {
    return;
  }
  NSMutableDictionary *next = [storedIdentities() mutableCopy];
  next[cid] = credential;
  [suiteDefaults() setObject:next forKey:kDefaultsKey];
}

static void removeStoredIdentity(NSString *credentialId)
{
  migrateLegacyIdentitiesIfNeeded();
  NSMutableDictionary *next = [storedIdentities() mutableCopy];
  [next removeObjectForKey:credentialId];
  [suiteDefaults() setObject:next forKey:kDefaultsKey];
}

static NSArray<ASPasswordCredentialIdentity *> *buildPasswordIdentities(void)
{
  NSDictionary *all = storedIdentities();
  NSMutableArray<ASPasswordCredentialIdentity *> *out = [NSMutableArray array];
  for (NSString *key in all) {
    NSDictionary *c = all[key];
    NSString *origin = c[@"normalizedOrigin"];
    if (!origin.length) {
      origin = c[@"url"];
    }
    NSURL *url = origin.length ? [NSURL URLWithString:origin] : nil;
    NSString *host = url.host;
    if (!host.length) {
      continue;
    }
    ASCredentialServiceIdentifier *sid =
        [[ASCredentialServiceIdentifier alloc] initWithIdentifier:host
                                                               type:ASCredentialServiceIdentifierTypeDomain];
    NSString *user = c[@"loginUsername"] ?: @"";
    NSString *rid = c[@"id"] ?: key;
    ASPasswordCredentialIdentity *pid =
        [[ASPasswordCredentialIdentity alloc] initWithServiceIdentifier:sid user:user recordIdentifier:rid];
    [out addObject:pid];
  }
  return out;
}

RCT_EXPORT_METHOD(replaceIdentity:(NSDictionary *)credential
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  if (!credential[@"id"]) {
    reject(@"invalid", @"missing credential id", nil);
    return;
  }
  persistIdentity(credential);
  NSArray *idents = buildPasswordIdentities();
  ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedCredentialIdentityStore];
  [store saveCredentialIdentities:idents
                completion:^(BOOL success, NSError *_Nullable error) {
                  if (success) {
                    resolve(@YES);
                  } else {
                    reject(@"store", error.localizedDescription ?: @"saveCredentialIdentities failed", error);
                  }
                }];
}

RCT_EXPORT_METHOD(removeIdentity:(NSString *)credentialId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  removeStoredIdentity(credentialId);
  NSArray *idents = buildPasswordIdentities();
  ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedCredentialIdentityStore];
  [store saveCredentialIdentities:idents
                completion:^(BOOL success, NSError *_Nullable error) {
                  if (success) {
                    resolve(@YES);
                  } else {
                    reject(@"store", error.localizedDescription ?: @"saveCredentialIdentities failed", error);
                  }
                }];
}

@end
