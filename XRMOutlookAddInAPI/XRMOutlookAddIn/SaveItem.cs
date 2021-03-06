using Microsoft.Azure.KeyVault;
using Microsoft.Azure.Services.AppAuthentication;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace XRMOutlookAddIn
{
    public static class SaveItem
    {
        private static HttpClient _sharedHttpClient = new HttpClient();


        [FunctionName("SaveItem")]
        public static async Task<HttpResponseMessage> Run([HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequestMessage req, ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");
            GetData fields = await req.Content.ReadAsAsync<GetData>();
            string domain = fields.domain;
            //Getting the Application settings
            var keyVaultName = Environment.GetEnvironmentVariable("KeyVaultName", EnvironmentVariableTarget.Process);
            var azureServiceTokenProvider = new AzureServiceTokenProvider();
            var keyVaultClient = new KeyVaultClient(new KeyVaultClient.AuthenticationCallback(azureServiceTokenProvider.KeyVaultTokenCallback));
            string connection = (await keyVaultClient.GetSecretAsync($"https://{keyVaultName}.vault.azure.net/secrets/{domain + "Connection"}")).Value;
            string resourceId = Environment.GetEnvironmentVariable("ResourceId", EnvironmentVariableTarget.Process);
            string tenantid = connection.Split(';')[0];
            string authString = Environment.GetEnvironmentVariable("AuthString", EnvironmentVariableTarget.Process) + tenantid;
            string clientId = connection.Split(';')[1];
            string clientSecret = connection.Split(';')[2];
            string host = $"{domain}.sharepoint.com";

            try
            {
                MailData postFields = new MailData()
                {
                    Subject = fields.Subject,
                    To = fields.To,
                    Message = fields.Message,
                    From = fields.From,
                    conversationId = fields.ConversationId,
                    conversationTopic = fields.ConversationTopic,
                    received = fields.Received,
                    itemid = fields.itemid,
                    listid = fields.listid
                };
                PostData data = new PostData();
                data.fields = postFields;
                var posdata = JsonConvert.SerializeObject(data);

                string rel = new Uri(fields.sitecollectionUrl).AbsolutePath;
                string siteurl = "";
                siteurl = rel == "/" ? host : string.Format("{0}:{1}:", host, rel);
                string listname = fields.listname;
                string requesturl = string.Format("https://graph.microsoft.com/v1.0/sites/{0}/lists('{1}')/items", siteurl, listname);

                var authenticationContext = new AuthenticationContext(authString, false);
                ClientCredential clientCred = new ClientCredential(clientId, clientSecret);
                AuthenticationResult authenticationResult = await authenticationContext.AcquireTokenAsync(resourceId, clientCred);
                string token = authenticationResult.AccessToken;
                if (!string.IsNullOrEmpty(token))
                {
                    log.LogInformation("successfully obtained access token");
                }

                HttpRequestMessage requestMsg = new HttpRequestMessage(new HttpMethod("POST"), requesturl);
                requestMsg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                requestMsg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                requestMsg.Content = new StringContent(posdata, Encoding.UTF8, "application/json");
                HttpResponseMessage response = _sharedHttpClient.SendAsync(requestMsg).Result;
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return req.CreateResponse(HttpStatusCode.OK, new { summary = "Mail was saved successfully." });
                }
                else
                {
                    throw new Exception("Error while saving the item. Please contact the administrator.");
                }
            }
            catch (Exception ex)
            {
                log.LogError(string.Format("Exception! '{0}'.", ex));
                return req.CreateResponse(HttpStatusCode.InternalServerError, new { summary = "Error" });
            }
        }
    }

    internal class MailData
    {
        [JsonProperty(PropertyName = "Title")]
        public string Subject { get; set; }
        [JsonProperty(PropertyName = "To")]
        public string To { get; set; }
        [JsonProperty(PropertyName = "Message")]
        public string Message { get; set; }
        [JsonProperty(PropertyName = "From")]
        public string From { get; set; }

        [JsonProperty(PropertyName = "ConversationId")]
        public string conversationId { get; set; }

        [JsonProperty(PropertyName = "ConversationTopic")]
        public string conversationTopic { get; set; }
        [JsonProperty(PropertyName = "Received")]
        public string received { get; set; }
        [JsonProperty(PropertyName = "RelatedItemId")]
        public string itemid { get; set; }
        [JsonProperty(PropertyName = "RelatedItemListId")]
        public string listid { get; set; }

    }

    internal class GetData
    {
        public string Subject { get; set; }
        public string To { get; set; }
        public string Message { get; set; }
        public string From { get; set; }
        public string ConversationId { get; set; }
        public string ConversationTopic { get; set; }
        public string Received { get; set; }
        public string itemid { get; set; }
        public string listid { get; set; }
        public string sitecollectionUrl { get; set; }
        public string listname { get; set; }
        public string domain { get; set; }
    }

    internal class PostData
    {
        public MailData fields { get; set; }
    }
}
