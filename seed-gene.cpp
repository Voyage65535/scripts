/*IOTA种子随机生成器*/
#include <cstdio>
#include <ctime>
#include <cstdlib>
#include <string>

using std::string;

const size_t MAX_CHAR = 81;
string src = "99ABCDEFGHIJKLMNOPQRSTUVWXYZ";

int main()
{
	string dst = "";
	srand((unsigned)time(nullptr));

	for (size_t i = 0; i < MAX_CHAR; ++i)
		dst += src[rand() % src.size()];
	
	FILE* fd = fopen("seed.txt", "w");
	if (fd == nullptr)
		exit(EXIT_FAILURE);
	
	fputs(dst.c_str(), fd);
	fclose(fd);
	
	return 0;
}
