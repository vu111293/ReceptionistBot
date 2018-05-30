class DialogflowUtils {

    static parseUserInfo(agent) {

        let source = agent.requestSource == null || agent.requestSource == '' ? 'CHATBOT' : agent.requestSource;
        let result = {
            source: source
        };
        switch(source) {
            case 'SLACK':
                let payload = agent.originalRequest.payload; 
                result.info = {
                    channel: payload.channel ? payload.channel.id : payload.event.channel,
                    userid: payload.user ? payload.user.id :payload.event.user
                }
            break;

            case 'CHATBOT':
                result.info = {
                    sessionid: agent.request_.body.sessionId
                }
                break;
            
            default:
            break;
        }
        return result;
    }



}

module.exports = DialogflowUtils;