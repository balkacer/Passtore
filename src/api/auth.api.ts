import Credentials from '../models/credentials.models';
import UserModel from '../models/user.model';
import BaseApi from './base.api';

class AuthApi extends BaseApi {
  constructor() {
    super('https://0t69sn05-3000.use2.devtunnels.ms/api');
  }

  login(credentials: Credentials) {
    return this.post('/auth/login', credentials);
  }

  register(userData: UserModel) {
    return this.post('api/auth/register', userData);
  }

  logout() {
    return this.post('/auth/logout');
  }
}

export default new AuthApi();