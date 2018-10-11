import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen';

Terminal.applyAddon(attach);
Terminal.applyAddon(fullscreen);
var term = new Terminal();
var socket = new WebSocket('ws://localhost:7331');

term.attach(socket);
term.open(document.querySelector('#terminal'));
