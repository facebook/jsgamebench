// Copyright 2004-present Facebook. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

var TrenchPlayer = (function() {

    var player_model;
    var player_matrix;
    var player_pos = [0,0,0];
    var player_velocity;
    var player_id;

    var actual_velocity;
    var gun_cooldown;

    var player_radius = 0.7;

    var player_forward_velocity = 5;
    var thrust_drag = 0.6;
    var thrust_accel = 6;
    var thrust_max_speed = 50;

    var bullet_velocity = [0, 15, 0];
    var bullet_radius = 0.3;
    var bullet_life = 3;
    var bullet_fire_rate = 0.2;

    function init(model) {
      player_model = model;
      if (typeof player_id === 'undefined') {
        World3D.updateDynamic(player_id, player_model);
      }
    }

    function reset() {
      player_matrix = Math3D.mat4x4();
      player_pos = [0,0,0];
      player_velocity = [0,0,0];
      gun_cooldown = 0;

      if (typeof player_id !== 'undefined') {
        World3D.removeDynamic(player_id);
      }
      player_id = World3D.addDynamic(player_model, player_matrix,
                                     player_pos, player_radius);
    }

    function keyDown(ascii) {
      return Input.key_state[ascii.charCodeAt(0)] > 0;
    }

    function keyDownReset(ascii) {
      var ret = Input.key_state[ascii.charCodeAt(0)] > 0;
      Input.key_state[ascii.charCodeAt(0)] = 0;
      return ret;
    }

    function collision(result) {
      var dp = Math3D.dotVec3(result.n, actual_velocity);
      Math3D.addVec3Self(player_velocity,
                         Math3D.scaleVec3(result.n, -1.6 * dp));

      // update the position, no collision
      // the offset is to center the model
      player_pos = result.p;
      player_matrix[12] = player_pos[0] - 0.5;
      player_matrix[13] = player_pos[1] - 0.5;
      player_matrix[14] = player_pos[2] - 0.5;
      World3D.moveDynamic(player_id, player_matrix,
                          player_pos, null);
      return true;
    }

    function tick(dt) {

      var player_thrust = [0,0,0];
      if (Input.key_state[Key.UP]) {
        player_thrust[2] += 1;
      }
      if (Input.key_state[Key.DOWN]) {
        player_thrust[2] -= 1;
      }
      if (Input.key_state[Key.RIGHT]) {
        player_thrust[0] += 1;
      }
      if (Input.key_state[Key.LEFT]) {
        player_thrust[0] -= 1;
      }
      if (keyDown(' ')) {
        player_thrust[1] += 1;
      }
      if (keyDown('Z')) {
        player_thrust[1] -= 0.5;
      }

      // update thrust and apply
      Math3D.scaleVec3Self(player_velocity, 1.0 - dt * thrust_drag);
      Math3D.normalizeVec3(player_thrust);
      Math3D.scaleVec3Self(player_thrust, dt * thrust_accel);
      Math3D.addVec3Self(player_velocity, player_thrust);

      var speed = Math3D.lengthVec3(player_velocity);
      if (speed > thrust_max_speed) {
        Math3D.scaleVec3Self(player_velocity, thrust_max_speed / speed);
      }

      actual_velocity = Math3D.addVec3(player_velocity,
                                       [0, player_forward_velocity, 0]);
      Math3D.addVec3Self(player_pos, Math3D.scaleVec3(actual_velocity, dt));

      // the offset is to center the model
      player_matrix[12] = player_pos[0] - 0.5;
      player_matrix[13] = player_pos[1] - 0.5;
      player_matrix[14] = player_pos[2] - 0.5;
      World3D.moveDynamic(player_id, player_matrix,
                          player_pos, collision);

      // guns!
      gun_cooldown -= dt;
      if (gun_cooldown < 0) {
        gun_cooldown = 0;
      }
      if (gun_cooldown == 0 && keyDown('X')) {
        var vel = Math3D.addVec3(actual_velocity, bullet_velocity);
        TrenchProjectile.create(player_pos, vel, bullet_radius,
                                bullet_life, collision);
        gun_cooldown = bullet_fire_rate;
      }

    }

    function getPosition() {
      return Math3D.dupVec3(player_pos);
    }

    var TrenchPlayer = {};
    TrenchPlayer.init = init;
    TrenchPlayer.reset = reset;
    TrenchPlayer.tick = tick;
    TrenchPlayer.getPosition = getPosition;
    return TrenchPlayer;
  })();
