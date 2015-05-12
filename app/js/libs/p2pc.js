define([
  'underscore',
], function( _ ) {
  var P2PC = function( id, options ) {
    options   = options || {};
    return {

      // Identifier
      id: id,

      // Peer Connection
      pc: null,

      // Data Channels
      channels: {},

      // Signaling Channel
      p2ps: options.signal,

      // Debug flag
      debug: options.debug || false,

      // Shims
      PeerConnection: window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection,
      IceCandidate: window.mozRTCIceCandidate || window.RTCIceCandidate || window.RTCIceCandidate,
      SessionDescription: window.mozRTCSessionDescription || window.RTCSessionDescription,
      getUserMedia: navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia,

      // RTCConfiguration
      rtc_config: options.rtc_config || {
        iceServers: [
          {url: "stun:23.21.150.121"},
          {url: "stun:stun.l.google.com:19302"}
        ]
      },

      // RTCOptions
      rtc_options: options.rtc_options || {

        // @TODO - Why do the below configuration options break file transfer in chrome to chrome?
        // @TODO - Do both of the options break file transfer in chrome or just one or the other?
        //optional: [
        //  {DtlsSrtpKeyAgreement: true},
        //  {RtpDataChannels: true}
        //]
        optional: [
          {DtlsSrtpKeyAgreement: true}
        ]
      },

      // RTC Default Handlers
      rtc_handlers: {
        onaddstream: options.onaddstream || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onaddstream::', e);
        },
        ondatachannel: options.ondatachannel || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.ondatachannel::', e);
        },
        onicecandidate: options.onicecandidate || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onicecandidate::', e);
          if (e.candidate == null) return;
          var _this         = this,
              candidate     = e.candidate,
              client_id     = this.p2pc.id,
              peer_id       = this.p2pc.peer_id;

          // Listen for ice candidates from peer
          this.p2pc.p2ps.onmessage('P2PC_IceCandidate', function( candidateMessage ) {

            // Set ice candidate from peer
            _this.p2pc.pc.addIceCandidate(new _this.p2pc.IceCandidate(candidateMessage.message));
          });

          // Send ice candidate to peer
          this.p2pc.p2ps.send('P2PC_IceCandidate', peer_id, client_id, {
            candidate: candidate.candidate,
            sdpMLineIndex: candidate.sdpMLineIndex
          });

          // Nullify handler
          this.onicecandidate = null;
        },
        oniceconnectionstatechange: options.oniceconnectionstatechange || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.oniceconnectionstatechange::', e);
        },
        onidentityresult: options.onidentityresult || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onidentityresult::', e);
        },
        onidpassertionerror: options.onidpassertionerror || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onidpassertionerror::', e);
        },
        onidpvalidationerror: options.onidpvalidationerror || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onidpvalidationerror::', e);
        },
        onnegotiationneeded: options.onnegotiationneeded || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onnegotiationneeded::', e);
        },
        onpeeridentity: options.onpeeridentity || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onpeeridentity::', e);
        },
        onremovestream: options.onremovestream || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onremovestream::', e);
        },
        onsignalstatechange: options.onsignalstatechange || function(e) {
          if (this.p2pc.debug) console.log('P2PC.rtc_handlers.onsignalstatechange::', e);
        }
      },

      // DC Configuration
      dc_config: options.dc_config || {
        ordered: true,
        reliable: true
      },

      // DC Handlers
      dc_handlers: {
        onopen: options.onopen || function(e) {
          if (this.debug) console.log('P2PC.dc_handlers.onopen::', e);
        },
        onerror: options.onerror || function(e) {
          if (this.debug) console.log('P2PC.dc_handlers.onerror::', e);
        },
        onmessage: options.onmessage || function(e) {
          if (this.debug) console.log('P2PC.dc_handlers.onmessage::', e);
        },
        onclose: options.onclose || function(e) {
          if (this.debug) console.log('P2PC.dc_handlers.onclose::', e);
        }
      },

      // Generic error handler
      errorHandler: function( err ) {
        console.log(err);
      },

      newListeningChannel: function( options ) {
        var _this               = this,
            channel_id          = options.channel_id,
            onDataChannelReady  = options.onDataChannelReady;

        // PEER/CLIENT - Listen for offers answers
        this.p2ps.onmessage(channel_id, function(message) {

          // Reference SDP description
          var sdp = message.message;

          // PEER - Respond to client offers
          if (sdp.type == 'offer') {

            // Build responding connection
            _this.newPeerConnection({
              rtc_handlers: {
                ondatachannel: function(e) {
                  var channel = e.channel;

                  // Create new data channel
                  _this.newDataChannel({
                    id: channel.label,
                    channel: channel
                  });

                  // Handle channel message
                  e.channel.onmessage = function(e) {
                    if (onDataChannelReady) {
                      onDataChannelReady.apply(this, [
                        {
                          this: this,
                          channel: channel,
                          data: e.data,
                          message: message,
                          event: e,
                          peer_id: message.peer_id
                        }
                      ]);
                    }
                  };
                }
              }
            });

            // Respond to client with answer
            _this.peer_id = message.peer_id;
            _this.answerPeerOffer(_this.pc, sdp, function(answer) {
              _this.p2ps.send(channel_id, message.peer_id, message.client_id, answer);
            });
          }

          // CLIENT - Respond to peer answers
          else if (sdp.type == 'answer') {

            // Set remote description with peer's answer
            _this.setRemoteDescription(_this.pc, sdp);
          }
        });
      },

      openListeningChannel: function( options ) {
        options = options || {};
        var _this                 = this,
            client_id             = options.client_id,
            channel_id            = options.channel_id,
            connection_id         = options.connection_id,
            connection_init       = this.pc ? true : false,
            onDataChannelMessage  = options.onDataChannelMessage,
            onDataChannelOpen     = options.onDataChannelOpen,
            onDataChannelClose    = options.onDataChannelClose,
            onDataChannelError    = options.onDataChannelError;

        // CLIENT - Create a peer connection
        if (!connection_init) this.newPeerConnection(connection_id);

        // CLIENT - Create a data channel
        this.newDataChannel({
          id: channel_id,
          pc: _this.pc,
          dc_handlers: {
            onopen: function(e) {
              onDataChannelOpen.apply(this, [
                {
                  channel: _this.channels[channel_id],
                  peer_id: connection_id,
                  event: e
                }
              ]);
            },
            onmessage: function(e) {
              onDataChannelMessage.apply(this, [
                {
                  channel: _this.channels[channel_id],
                  peer_id: connection_id,
                  data: e.data,
                  event: e
                }
              ]);
            },
            onclose: function(e) {
              onDataChannelClose.apply(this, [
                {
                  channel: _this.channels[channel_id],
                  peer_id: connection_id,
                  event: e
                }
              ]);
            },
            onerror: function(e) {
              onDataChannelError.apply(this, [
                {
                  channel: _this.channels[channel_id],
                  peer_id: connection_id,
                  event: e
                }
              ]);
            }
          }
        });

        // CLIENT - Create connection offer & send offer to peer
        if (!connection_init) {
          this.peer_id = connection_id;
          this.createClientOffer(this.pc, function(offer) {
            _this.p2ps.send(channel_id, connection_id, client_id, offer);
          });
        }

      },

      newPeerConnection: function( options ) {
        options = options || {};
        var rtc_config    = options.rtc_config || this.rtc_config,
            rtc_options   = options.rtc_options|| this.rtc_options,
            pc            = new this.PeerConnection(rtc_config, rtc_options),
            handlers      = options.rtc_handlers || {},
            rtc_handlers  = _.extend(this.rtc_handlers, handlers);

        // Attach rtc event handlers
        for (var handler in rtc_handlers) {
          pc[handler] = rtc_handlers[handler];
        }

        // Reference the p2pc object in the pc object
        pc.p2pc = this;

        return this.pc = pc;
      },

      newDataChannel: function( options ) {
        options = options || {};
        var
          id            = options.id || '',
          pc            = options.pc || this.pc,
          handlers      = options.dc_handlers || {},
          dc_handlers   = _.extend(this.dc_handlers, handlers),

          // @TODO - Determine why appending a random integer to the end of the channel ID allows data channel creation to work in chrome
          random_int    = Math.floor(Math.random() * (10000 - 1)),
          channel       = pc.createDataChannel(id + random_int, this.dc_config);

        // Attach data channel event handlers
        for (var handler in dc_handlers) {
          channel[handler] = dc_handlers[handler];
        }

        return this.channels[id] = channel;
      },

      setRemoteDescription: function( pc, sdp, callback ) {
        pc.setRemoteDescription(new this.SessionDescription(sdp), function() {
          if (callback) callback(pc, sdp);
        }, this.errorHandler);
      },

      createClientOffer: function( pc, callback ) {
        var _this = this;
        pc.createOffer(function(offer) {
          pc.setLocalDescription(offer, function() {
            if (callback) callback.call(pc, offer);
          }, _this.errorHandler);
        }, this.errorHandler);
      },

      answerPeerOffer: function( pc, offer, callback ) {
        var _this = this;
        pc.setRemoteDescription(new this.SessionDescription(offer), function() {
          pc.createAnswer(function(answer) {
            pc.setLocalDescription(answer);
            if (callback) callback.call(pc, answer);
          }, _this.errorHandler);
        }, this.errorHandler);
      }
    };
  };

  return P2PC;
});
